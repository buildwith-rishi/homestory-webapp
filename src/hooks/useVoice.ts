/**
 * =============================================================================
 * useVoice — Custom React Hook for Voice Features
 * =============================================================================
 *
 * Provides an easy-to-use interface for voice features:
 * - Text-to-speech synthesis
 * - Audio transcription
 * - Voice processing with AI
 *
 * Usage:
 *   const {
 *     synthesize,
 *     transcribe,
 *     processVoice,
 *     isProcessing,
 *     error
 *   } = useVoice();
 *
 *   // Text-to-speech
 *   const audioUrl = await synthesize("Hello world!");
 *
 *   // Transcribe audio
 *   const result = await transcribe(audioBlob);
 *
 * =============================================================================
 */

import { useState, useCallback, useRef } from "react";
import {
  synthesizeSpeech,
  transcribeAudio,
  processVoice as apiProcessVoice,
  blobToBase64,
  createAudioUrl,
  generateSessionId,
  type VoiceSynthesizeRequest,
  type VoiceTranscribeRequest,
  type VoiceTranscribeResponse,
  type VoiceProcessResponse,
} from "../services/voiceApi";

// =============================================================================
// Types
// =============================================================================

export interface UseVoiceOptions {
  /** Default language for transcription */
  defaultLanguage?: string;
  /** Default voice for synthesis */
  defaultVoice?: string;
  /** Enable speaker diarization by default */
  enableDiarization?: boolean;
  /** Maximum speakers for diarization */
  maxSpeakers?: number;
}

export interface UseVoiceReturn {
  // State
  isProcessing: boolean;
  isSynthesizing: boolean;
  isTranscribing: boolean;
  error: string | null;

  // Synthesis
  synthesize: (
    text: string,
    options?: Partial<VoiceSynthesizeRequest>
  ) => Promise<string | null>; // Returns audio URL
  playText: (
    text: string,
    options?: Partial<VoiceSynthesizeRequest>
  ) => Promise<void>; // Synthesize and play immediately

  // Transcription
  transcribe: (
    audioBlob: Blob,
    options?: Partial<VoiceTranscribeRequest>
  ) => Promise<VoiceTranscribeResponse | null>;
  transcribeFromBase64: (
    audioBase64: string,
    options?: Partial<VoiceTranscribeRequest>
  ) => Promise<VoiceTranscribeResponse | null>;

  // Voice processing (with AI)
  processVoice: (
    audioBlob: Blob,
    sessionId?: string
  ) => Promise<VoiceProcessResponse | null>;

  // Session management
  sessionId: string;
  resetSession: () => void;

  // Utilities
  clearError: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const {
    defaultLanguage = "en-IN",
    defaultVoice = "en-IN-Wavenet-A",
    enableDiarization = true,
    maxSpeakers = 6,
  } = options;

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session management
  const sessionIdRef = useRef<string>(generateSessionId());

  // ==========================================================================
  // Synthesis Functions
  // ==========================================================================

  /**
   * Synthesize text to speech and return an audio URL
   */
  const synthesize = useCallback(
    async (
      text: string,
      synthOptions?: Partial<VoiceSynthesizeRequest>
    ): Promise<string | null> => {
      setIsSynthesizing(true);
      setError(null);

      try {
        const response = await synthesizeSpeech({
          text,
          voice: defaultVoice,
          languageCode: defaultLanguage,
          ...synthOptions,
        });

        if (!response.success || !response.audioBase64) {
          throw new Error(response.error || "Failed to synthesize speech");
        }

        const audioUrl = createAudioUrl(
          response.audioBase64,
          response.contentType || "audio/mp3"
        );

        return audioUrl;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Synthesis failed";
        setError(errorMessage);
        console.error("[useVoice] Synthesis error:", err);
        return null;
      } finally {
        setIsSynthesizing(false);
      }
    },
    [defaultVoice, defaultLanguage]
  );

  /**
   * Synthesize text and play it immediately
   */
  const playText = useCallback(
    async (
      text: string,
      synthOptions?: Partial<VoiceSynthesizeRequest>
    ): Promise<void> => {
      const audioUrl = await synthesize(text, synthOptions);

      if (audioUrl) {
        const audio = new Audio(audioUrl);

        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = (err) => {
            URL.revokeObjectURL(audioUrl);
            reject(err);
          };
          audio.play().catch(reject);
        });
      }
    },
    [synthesize]
  );

  // ==========================================================================
  // Transcription Functions
  // ==========================================================================

  /**
   * Transcribe audio from a Blob
   */
  const transcribe = useCallback(
    async (
      audioBlob: Blob,
      transcribeOptions?: Partial<VoiceTranscribeRequest>
    ): Promise<VoiceTranscribeResponse | null> => {
      setIsTranscribing(true);
      setError(null);

      try {
        const audioBase64 = await blobToBase64(audioBlob);

        const response = await transcribeAudio({
          audioBase64,
          languageCode: defaultLanguage,
          enableSpeakerDiarization: enableDiarization,
          maxSpeakerCount: maxSpeakers,
          enableAutomaticPunctuation: true,
          ...transcribeOptions,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to transcribe audio");
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Transcription failed";
        setError(errorMessage);
        console.error("[useVoice] Transcription error:", err);
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [defaultLanguage, enableDiarization, maxSpeakers]
  );

  /**
   * Transcribe audio from base64 string
   */
  const transcribeFromBase64 = useCallback(
    async (
      audioBase64: string,
      transcribeOptions?: Partial<VoiceTranscribeRequest>
    ): Promise<VoiceTranscribeResponse | null> => {
      setIsTranscribing(true);
      setError(null);

      try {
        const response = await transcribeAudio({
          audioBase64,
          languageCode: defaultLanguage,
          enableSpeakerDiarization: enableDiarization,
          maxSpeakerCount: maxSpeakers,
          enableAutomaticPunctuation: true,
          ...transcribeOptions,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to transcribe audio");
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Transcription failed";
        setError(errorMessage);
        console.error("[useVoice] Transcription error:", err);
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [defaultLanguage, enableDiarization, maxSpeakers]
  );

  // ==========================================================================
  // Voice Processing Functions
  // ==========================================================================

  /**
   * Process voice with AI (transcribe + generate response)
   */
  const processVoice = useCallback(
    async (
      audioBlob: Blob,
      sessionId?: string
    ): Promise<VoiceProcessResponse | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const audioBase64 = await blobToBase64(audioBlob);
        const effectiveSessionId = sessionId || sessionIdRef.current;

        const response = await apiProcessVoice({
          audioBase64,
          sessionId: effectiveSessionId,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to process voice");
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Voice processing failed";
        setError(errorMessage);
        console.error("[useVoice] Processing error:", err);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // ==========================================================================
  // Session Management
  // ==========================================================================

  const resetSession = useCallback(() => {
    sessionIdRef.current = generateSessionId();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    isProcessing,
    isSynthesizing,
    isTranscribing,
    error,

    // Synthesis
    synthesize,
    playText,

    // Transcription
    transcribe,
    transcribeFromBase64,

    // Voice processing
    processVoice,

    // Session management
    sessionId: sessionIdRef.current,
    resetSession,

    // Utilities
    clearError,
  };
}

export default useVoice;
