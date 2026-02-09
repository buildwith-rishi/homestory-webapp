/**
 * =============================================================================
 * useMeetingRecording — Custom React Hook
 * =============================================================================
 *
 * Encapsulates all recording logic using REST-based audio upload:
 * - Microphone access via MediaRecorder API
 * - Audio chunks accumulated locally during recording
 * - On stop: base64-encoded audio uploaded via REST endpoint
 * - Direct voice transcription via /api/voice/transcribe endpoint
 * - Polling for transcript / summary after upload
 * - Audio level metering for UI visualization
 * - Clean teardown on unmount
 *
 * The server supports these endpoints:
 *   POST /api/meetings/:id/start   → mark recording started
 *   POST /api/meetings/:id/end     → upload audio, get transcript back
 *   POST /api/voice/transcribe     → direct audio transcription
 *   POST /api/voice/synthesize     → text-to-speech
 *   POST /api/voice                → voice processing with AI
 *
 * Usage:
 *   const { startRecording, stopRecording, isRecording, transcripts, ... }
 *     = useMeetingRecording(meetingId);
 * =============================================================================
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  startRecording as apiStartRecording,
  endRecording as apiEndRecording,
  getMeetingById,
  regenerate as apiRegenerate,
} from "../services/meetingApi";
import {
  transcribeAudio as voiceTranscribe,
  blobToBase64 as voiceBlobToBase64,
} from "../services/voiceApi";
import type { Meeting } from "../types";

// Re-export the connection state type so consumers don't need to change imports
export type WebSocketConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LiveTranscriptEntry {
  id: string;
  speaker: string;
  speakerId: number;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface MeetingSummaryResult {
  summary: string;
  actionItems: string[];
  keyPoints: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

export interface RecordingState {
  /** Whether the microphone is currently recording */
  isRecording: boolean;
  /** Connection state (kept for API-compat; maps to REST call status) */
  connectionState: WebSocketConnectionState;
  /** Transcripts received from server after processing */
  transcripts: LiveTranscriptEntry[];
  /** AI summary received after meeting ends */
  summary: MeetingSummaryResult | null;
  /** Processing stage after recording stops */
  processingStage: string | null;
  /** Current audio level (0-1) for visualizations */
  audioLevel: number;
  /** Any errors encountered */
  error: string | null;
  /** Whether the microphone is muted */
  isMuted: boolean;
  /** Duration in seconds */
  duration: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a Blob to a base64 data string (without the data-url prefix) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip "data:<mime>;base64," prefix
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Parse transcript text returned by the server into LiveTranscriptEntry[] */
function parseTranscriptText(raw: string | undefined): LiveTranscriptEntry[] {
  if (!raw) return [];

  const entries: LiveTranscriptEntry[] = [];
  // The server may return a plain text transcript or a structured one.
  // Try to split by newlines and create entries.
  const lines = raw.split("\n").filter((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try pattern: "Speaker X: text" or "Unknown: text"
    const speakerMatch = line.match(/^([^:]+):\s*(.+)/);
    const speaker = speakerMatch ? speakerMatch[1].trim() : "Speaker";
    const text = speakerMatch ? speakerMatch[2].trim() : line;

    entries.push({
      id: `t-server-${i}`,
      speaker,
      speakerId: i % 4, // cycle through speaker IDs for colouring
      text,
      timestamp: new Date(),
      isFinal: true,
    });
  }

  return entries;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMeetingRecording(meetingId: string | null) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>("disconnected");
  const [transcripts, setTranscripts] = useState<LiveTranscriptEntry[]>([]);
  const [summary, setSummary] = useState<MeetingSummaryResult | null>(null);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  // Refs for objects that shouldn't trigger re-renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  /** Accumulated audio chunks from MediaRecorder */
  const audioChunksRef = useRef<Blob[]>([]);
  /** Detected MIME type of the recording */
  const mimeTypeRef = useRef<string>("audio/webm");
  /** Polling timer for transcript status */
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Audio Level Metering ──────────────────────────────────────────────

  const startAudioMetering = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        setAudioLevel(rms);

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn("[Recording] Audio metering not available:", err);
    }
  }, []);

  const stopAudioMetering = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ─── Duration Timer ────────────────────────────────────────────────────

  const startDurationTimer = useCallback(() => {
    setDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // ─── Stop Polling ─────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // ─── Poll for Transcript ──────────────────────────────────────────────

  const pollForTranscript = useCallback(
    (id: string) => {
      let attempts = 0;
      const maxAttempts = 60; // ~5 minutes at 5s intervals

      pollTimerRef.current = setInterval(async () => {
        attempts++;
        try {
          const meeting: Meeting = await getMeetingById(id);
          console.log(
            "[Recording] Poll attempt",
            attempts,
            "- status:",
            meeting.status,
          );

          // Check if transcript is available (use normalized field names from mapApiMeetingToMeeting)
          const hasTranscript =
            (meeting.transcription && meeting.transcription.length > 0) ||
            (meeting.transcriptText && meeting.transcriptText.length > 0);

          const hasSummary = meeting.summary || meeting.aiAnalysis;

          if (hasTranscript || hasSummary || meeting.status === "ANALYZED") {
            // Parse transcript from transcription array or transcriptText
            if (meeting.transcription && meeting.transcription.length > 0) {
              const entries: LiveTranscriptEntry[] = meeting.transcription.map(
                (seg, i) => ({
                  id: `t-server-${i}`,
                  speaker: seg.speaker || `Speaker ${i + 1}`,
                  speakerId: i % 4,
                  text: seg.text,
                  timestamp: new Date(),
                  isFinal: true,
                }),
              );
              setTranscripts(entries);
            } else if (meeting.transcriptText) {
              const parsed = parseTranscriptText(meeting.transcriptText);
              if (parsed.length > 0) {
                setTranscripts(parsed);
              }
            }

            // Parse summary
            if (meeting.summary || meeting.actionItems) {
              setSummary({
                summary: meeting.summary || "",
                actionItems: meeting.actionItems || [],
                keyPoints: meeting.keyPoints || [],
              });
            }

            setProcessingStage(null);
            setConnectionState("disconnected");
            stopPolling();
            console.log("[Recording] Transcript received successfully");
          }

          // If still processing, update stage
          if (meeting.status === "PROCESSING") {
            setProcessingStage("transcribing");
          }
        } catch (err) {
          console.warn("[Recording] Poll error:", err);
        }

        // Stop after max attempts
        if (attempts >= maxAttempts) {
          stopPolling();
          setProcessingStage(null);
          setConnectionState("disconnected");
          console.warn(
            "[Recording] Polling timed out after",
            attempts,
            "attempts",
          );
        }
      }, 5000);
    },
    [stopPolling],
  );

  // ─── Upload Audio & Get Transcript ────────────────────────────────────

  const uploadAudioAndGetTranscript = useCallback(
    async (id: string) => {
      const chunks = audioChunksRef.current;
      if (chunks.length === 0) {
        console.warn("[Recording] No audio chunks to upload");
        setConnectionState("disconnected");
        return;
      }

      setConnectionState("connecting"); // re-use as "uploading" state
      setProcessingStage("transcribing");

      try {
        // Combine all chunks into a single Blob
        const mimeType = mimeTypeRef.current;
        const fullBlob = new Blob(chunks, { type: mimeType });
        console.log(
          "[Recording] Uploading audio:",
          (fullBlob.size / 1024).toFixed(1),
          "KB,",
          mimeType,
        );

        // Convert to base64
        const audioBase64 = await blobToBase64(fullBlob);

        // Derive a simple content type (strip codecs info)
        const contentType = mimeType.split(";")[0]; // e.g. "audio/webm"

        setConnectionState("connected"); // upload in progress

        // First, try direct voice transcription API for immediate results
        let directTranscriptSuccess = false;
        try {
          console.log("[Recording] Trying direct voice transcription API...");
          const voiceResponse = await voiceTranscribe({
            audioBase64,
            languageCode: "en-IN",
            enableSpeakerDiarization: true,
            maxSpeakerCount: 6,
            enableAutomaticPunctuation: true,
          });

          if (voiceResponse.success && voiceResponse.segments && voiceResponse.segments.length > 0) {
            console.log("[Recording] Voice API transcription successful:", voiceResponse.segments.length, "segments");
            
            // Convert voice API segments to LiveTranscriptEntry format
            const entries: LiveTranscriptEntry[] = voiceResponse.segments.map((seg, i) => ({
              id: `t-voice-${i}`,
              speaker: seg.speaker || `Speaker ${i + 1}`,
              speakerId: parseInt(seg.speaker?.replace(/\D/g, "") || String(i)) % 4,
              text: seg.text,
              timestamp: new Date(),
              isFinal: true,
            }));
            setTranscripts(entries);
            directTranscriptSuccess = true;
            setProcessingStage("analyzing");
          } else if (voiceResponse.success && voiceResponse.transcription) {
            // Full text transcription without segments
            console.log("[Recording] Voice API returned full text transcription");
            const parsed = parseTranscriptText(voiceResponse.transcription);
            if (parsed.length > 0) {
              setTranscripts(parsed);
              directTranscriptSuccess = true;
              setProcessingStage("analyzing");
            }
          }
        } catch (voiceErr) {
          console.warn("[Recording] Direct voice API failed, falling back to meeting endpoint:", voiceErr);
        }

        // POST to /api/meetings/:id/end with audio data (always do this to save the recording)
        const meeting = await apiEndRecording(id, {
          audioBase64,
          contentType,
        });

        console.log("[Recording] Upload complete, meeting:", meeting.status);

        // If direct transcription didn't work, try to get from meeting response
        if (!directTranscriptSuccess) {
          // If the server immediately returns transcript/summary, use it
          const hasTranscript =
            (meeting.transcription && meeting.transcription.length > 0) ||
            (meeting.transcriptText && meeting.transcriptText.length > 0);

          if (hasTranscript) {
            if (meeting.transcription && meeting.transcription.length > 0) {
              const entries: LiveTranscriptEntry[] = meeting.transcription.map(
                (seg, i) => ({
                  id: `t-upload-${i}`,
                  speaker: seg.speaker || `Speaker ${i + 1}`,
                  speakerId: i % 4,
                  text: seg.text,
                  timestamp: new Date(),
                  isFinal: true,
                }),
              );
              setTranscripts(entries);
            } else if (meeting.transcriptText) {
              const parsed = parseTranscriptText(meeting.transcriptText);
              if (parsed.length > 0) {
                setTranscripts(parsed);
              }
            }
          }
        }

        if (meeting.summary || meeting.actionItems) {
          setSummary({
            summary: meeting.summary || "",
            actionItems: meeting.actionItems || [],
            keyPoints: meeting.keyPoints || [],
          });
          setProcessingStage(null);
          setConnectionState("disconnected");
        } else if (!directTranscriptSuccess) {
          // Server uploaded audio but transcript is empty — trigger regeneration
          // The server doesn't auto-transcribe; we must call regenerate explicitly
          setProcessingStage("transcribing");
          console.log(
            "[Recording] No transcript yet — triggering regenerate(all)...",
          );
          try {
            const regenMeeting = await apiRegenerate(id, "all");
            console.log(
              "[Recording] Regenerate response, status:",
              regenMeeting.status,
            );

            const regenHasTranscript =
              (regenMeeting.transcription &&
                regenMeeting.transcription.length > 0) ||
              (regenMeeting.transcriptText &&
                regenMeeting.transcriptText.length > 0);

            if (regenHasTranscript || regenMeeting.summary) {
              // Regenerate returned results immediately
              if (
                regenMeeting.transcription &&
                regenMeeting.transcription.length > 0
              ) {
                const entries: LiveTranscriptEntry[] =
                  regenMeeting.transcription.map((seg, i) => ({
                    id: `t-regen-${i}`,
                    speaker: seg.speaker || `Speaker ${i + 1}`,
                    speakerId: i % 4,
                    text: seg.text,
                    timestamp: new Date(),
                    isFinal: true,
                  }));
                setTranscripts(entries);
              } else if (regenMeeting.transcriptText) {
                const parsed = parseTranscriptText(regenMeeting.transcriptText);
                if (parsed.length > 0) setTranscripts(parsed);
              }
              if (regenMeeting.summary || regenMeeting.actionItems) {
                setSummary({
                  summary: regenMeeting.summary || "",
                  actionItems: regenMeeting.actionItems || [],
                  keyPoints: regenMeeting.keyPoints || [],
                });
              }
              setProcessingStage(null);
              setConnectionState("disconnected");
            } else {
              // Regenerate was accepted but processing async — poll
              console.log(
                "[Recording] Regenerate accepted, polling for results...",
              );
              pollForTranscript(id);
            }
          } catch (regenErr) {
            console.warn(
              "[Recording] Regenerate failed, falling back to polling:",
              regenErr,
            );
            pollForTranscript(id);
          }
        } else {
          // Direct transcription was successful, finalize
          setProcessingStage(null);
          setConnectionState("disconnected");
        }
      } catch (err) {
        console.error("[Recording] Upload failed:", err);
        setError(
          err instanceof Error
            ? `Upload failed: ${err.message}`
            : "Failed to upload recording",
        );
        setProcessingStage(null);
        setConnectionState("error");
      }
    },
    [pollForTranscript],
  );

  // ─── Start Recording ──────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (!meetingId) {
      setError("No meeting ID provided");
      return;
    }

    setError(null);
    audioChunksRef.current = [];

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // 2. Notify server that recording has started
      setConnectionState("connecting");
      try {
        await apiStartRecording(meetingId);
        console.log("[Recording] Server notified — recording started");
        setConnectionState("connected");
      } catch (apiErr) {
        console.warn(
          "[Recording] Server start-recording call failed (continuing locally):",
          apiErr,
        );
        // Continue anyway — the local recording is the important part
        setConnectionState("connected");
      }

      // 3. Set up MediaRecorder to accumulate audio locally
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("[Recording] MediaRecorder error:", e);
        setError(
          "Microphone recording error. Please check your audio settings.",
        );
      };

      // Collect chunks every 1 second
      mediaRecorder.start(1000);

      // 4. Start audio metering
      startAudioMetering(stream);

      // 5. Start duration timer
      startDurationTimer();

      setIsRecording(true);
      console.log("[Recording] Started successfully (REST mode)");
    } catch (err) {
      console.error("[Recording] Failed to start:", err);

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError(
            "Microphone access denied. Please allow microphone access in your browser settings.",
          );
        } else if (err.name === "NotFoundError") {
          setError(
            "No microphone found. Please connect a microphone and try again.",
          );
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to start recording",
        );
      }
    }
  }, [meetingId, startAudioMetering, startDurationTimer]);

  // ─── Stop Recording ───────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    const currentMeetingId = meetingId;

    // Stop MediaRecorder — this triggers the final `dataavailable` event
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      // Listen for the final chunk before uploading
      const recorder = mediaRecorderRef.current;
      recorder.onstop = () => {
        // Now all chunks have been collected — upload to server
        if (currentMeetingId) {
          uploadAudioAndGetTranscript(currentMeetingId);
        }
      };
      recorder.stop();
      mediaRecorderRef.current = null;
    }

    // Stop media stream tracks (release microphone)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop audio metering
    stopAudioMetering();

    // Stop duration timer
    stopDurationTimer();

    setIsRecording(false);
    console.log("[Recording] Stopped — uploading audio…");
  }, [
    meetingId,
    stopAudioMetering,
    stopDurationTimer,
    uploadAudioAndGetTranscript,
  ]);

  // ─── Toggle Mute ──────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;

      // Actually mute/unmute the audio tracks
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted;
        });
      }

      return newMuted;
    });
  }, []);

  // ─── Clear Transcripts ─────────────────────────────────────────────────

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  // ─── Reset ─────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    stopRecording();
    setTranscripts([]);
    setSummary(null);
    setProcessingStage(null);
    setError(null);
    setDuration(0);
    audioChunksRef.current = [];
  }, [stopRecording]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopAudioMetering();
      stopDurationTimer();
      stopPolling();
    };
  }, [stopAudioMetering, stopDurationTimer, stopPolling]);

  // ─── Format Duration ──────────────────────────────────────────────────

  const formattedDuration = (() => {
    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = duration % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  })();

  return {
    // State
    isRecording,
    connectionState,
    transcripts,
    summary,
    processingStage,
    audioLevel,
    error,
    isMuted,
    duration,
    formattedDuration,

    // Actions
    startRecording,
    stopRecording,
    toggleMute,
    clearTranscripts,
    reset,
  };
}

export default useMeetingRecording;
