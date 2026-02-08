/**
 * =============================================================================
 * VOICE API SERVICE
 * =============================================================================
 *
 * Handles all voice-related API operations for meetings:
 * - Audio processing and transcription
 * - Text-to-speech synthesis
 * - Real-time voice transcription
 *
 * These APIs are crucial for the meeting transcription feature, allowing
 * users to record meetings and get accurate transcriptions displayed
 * in the meeting details page.
 *
 * =============================================================================
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Voice API Base URL:", API_BASE_URL);

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Request payload for voice processing
 * POST /api/voice
 */
export interface VoiceProcessRequest {
  /** Base64-encoded audio data */
  audioBase64: string;
  /** Session UUID for maintaining conversation context */
  sessionId: string;
}

/**
 * Response from voice processing endpoint
 */
export interface VoiceProcessResponse {
  /** Whether the processing was successful */
  success: boolean;
  /** The transcribed text from the audio */
  transcription?: string;
  /** AI-generated response (if applicable) */
  aiResponse?: string;
  /** Synthesized audio response as base64 (if applicable) */
  audioResponseBase64?: string;
  /** Session ID for subsequent requests */
  sessionId: string;
  /** Any error message */
  error?: string;
  /** Processing timestamp */
  processedAt?: string;
}

/**
 * Request payload for text-to-speech synthesis
 * POST /api/voice/synthesize
 */
export interface VoiceSynthesizeRequest {
  /** Text to convert to speech */
  text: string;
  /** Voice model to use (e.g., "en-IN-Wavenet-A", "en-US-Neural2-A") */
  voice?: string;
  /** Language code (e.g., "en-IN", "en-US") */
  languageCode?: string;
  /** Speaking rate (0.25 to 4.0, default 1.0) */
  speakingRate?: number;
  /** Pitch adjustment (-20.0 to 20.0, default 0) */
  pitch?: number;
}

/**
 * Response from text-to-speech synthesis endpoint
 */
export interface VoiceSynthesizeResponse {
  /** Whether the synthesis was successful */
  success: boolean;
  /** Base64-encoded audio data */
  audioBase64?: string;
  /** Audio content type (e.g., "audio/mp3", "audio/wav") */
  contentType?: string;
  /** Duration of the audio in seconds */
  durationSeconds?: number;
  /** Any error message */
  error?: string;
}

/**
 * Request payload for audio transcription
 * POST /api/voice/transcribe
 */
export interface VoiceTranscribeRequest {
  /** Base64-encoded audio data */
  audioBase64: string;
  /** Language code for transcription (e.g., "en-IN", "en-US", "hi-IN") */
  languageCode?: string;
  /** Audio encoding type (e.g., "WEBM_OPUS", "LINEAR16", "MP3") */
  encoding?: string;
  /** Sample rate in hertz (e.g., 16000, 48000) */
  sampleRateHertz?: number;
  /** Enable speaker diarization */
  enableSpeakerDiarization?: boolean;
  /** Minimum number of speakers (for diarization) */
  minSpeakerCount?: number;
  /** Maximum number of speakers (for diarization) */
  maxSpeakerCount?: number;
  /** Enable automatic punctuation */
  enableAutomaticPunctuation?: boolean;
  /** Model to use (e.g., "latest_long", "phone_call", "video") */
  model?: string;
}

/**
 * Single word/segment in transcription with timing
 */
export interface TranscriptionWord {
  /** The transcribed word */
  word: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Speaker tag (if diarization enabled) */
  speakerTag?: number;
}

/**
 * A segment of transcription (typically a sentence or phrase)
 */
export interface TranscriptionSegment {
  /** Speaker identifier */
  speaker: string;
  /** The transcribed text */
  text: string;
  /** Start timestamp in seconds */
  timestamp: number;
  /** End timestamp in seconds */
  endTimestamp?: number;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Individual words with timing */
  words?: TranscriptionWord[];
}

/**
 * Response from audio transcription endpoint
 */
export interface VoiceTranscribeResponse {
  /** Whether the transcription was successful */
  success: boolean;
  /** Full transcribed text */
  transcription?: string;
  /** Segmented transcription with speaker info and timestamps */
  segments?: TranscriptionSegment[];
  /** Detected language code */
  languageCode?: string;
  /** Total duration of the audio in seconds */
  durationSeconds?: number;
  /** Number of detected speakers (if diarization enabled) */
  speakerCount?: number;
  /** Any error message */
  error?: string;
  /** Processing metadata */
  metadata?: {
    model: string;
    processingTimeMs: number;
    audioChannels: number;
    sampleRateHertz: number;
  };
}

/**
 * Available voice options for synthesis
 */
export interface VoiceOption {
  /** Voice ID (e.g., "en-IN-Wavenet-A") */
  id: string;
  /** Display name (e.g., "Indian English - Female 1") */
  name: string;
  /** Language code */
  languageCode: string;
  /** Voice gender */
  gender: "MALE" | "FEMALE" | "NEUTRAL";
  /** Voice type (Standard, Wavenet, Neural2, etc.) */
  type: "STANDARD" | "WAVENET" | "NEURAL2";
}

/**
 * Available language options for transcription
 */
export interface LanguageOption {
  /** Language code (e.g., "en-IN") */
  code: string;
  /** Display name (e.g., "English (India)") */
  name: string;
  /** Is this the default option */
  isDefault?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get authentication headers for API requests
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API response and throw on errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Process audio through voice API
 * This is the main endpoint for real-time voice processing during meetings.
 * It handles audio input, transcription, and optional AI response generation.
 *
 * POST /api/voice
 *
 * @param request - Contains audioBase64 and sessionId
 * @returns VoiceProcessResponse with transcription and optional AI response
 *
 * @example
 * ```typescript
 * const response = await processVoice({
 *   audioBase64: "base64-encoded-audio-data",
 *   sessionId: "meeting-session-uuid"
 * });
 * console.log(response.transcription); // "Hello, I'd like to discuss..."
 * ```
 */
export async function processVoice(
  request: VoiceProcessRequest
): Promise<VoiceProcessResponse> {
  try {
    console.log("[VoiceAPI] Processing voice audio, sessionId:", request.sessionId);

    const response = await fetch(`${API_BASE_URL}/api/voice`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    const data = await handleResponse<VoiceProcessResponse>(response);
    console.log("[VoiceAPI] Voice processed successfully:", data.success);
    return data;
  } catch (error) {
    console.error("[VoiceAPI] Error processing voice:", error);
    throw error;
  }
}

/**
 * Synthesize text to speech
 * Converts text to audio using Google Cloud TTS or similar service.
 *
 * POST /api/voice/synthesize
 *
 * @param request - Contains text and optional voice settings
 * @returns VoiceSynthesizeResponse with base64 audio data
 *
 * @example
 * ```typescript
 * const response = await synthesizeSpeech({
 *   text: "Hello, welcome to GoodHomeStory!",
 *   voice: "en-IN-Wavenet-A"
 * });
 * 
 * // Play the audio
 * const audio = new Audio(`data:audio/mp3;base64,${response.audioBase64}`);
 * audio.play();
 * ```
 */
export async function synthesizeSpeech(
  request: VoiceSynthesizeRequest
): Promise<VoiceSynthesizeResponse> {
  try {
    console.log("[VoiceAPI] Synthesizing speech:", request.text.substring(0, 50) + "...");

    const response = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text: request.text,
        voice: request.voice || "en-IN-Wavenet-A",
        languageCode: request.languageCode || "en-IN",
        speakingRate: request.speakingRate || 1.0,
        pitch: request.pitch || 0,
      }),
    });

    const data = await handleResponse<VoiceSynthesizeResponse>(response);
    console.log("[VoiceAPI] Speech synthesized successfully");
    return data;
  } catch (error) {
    console.error("[VoiceAPI] Error synthesizing speech:", error);
    throw error;
  }
}

/**
 * Transcribe audio to text
 * This is the primary endpoint for converting meeting recordings to text.
 * Supports speaker diarization for multi-person meetings.
 *
 * POST /api/voice/transcribe
 *
 * @param request - Contains audioBase64 and optional transcription settings
 * @returns VoiceTranscribeResponse with full transcription and segments
 *
 * @example
 * ```typescript
 * const response = await transcribeAudio({
 *   audioBase64: "base64-encoded-audio",
 *   languageCode: "en-IN",
 *   enableSpeakerDiarization: true,
 *   maxSpeakerCount: 4
 * });
 * 
 * // Access transcription segments
 * response.segments?.forEach(segment => {
 *   console.log(`${segment.speaker}: ${segment.text}`);
 * });
 * ```
 */
export async function transcribeAudio(
  request: VoiceTranscribeRequest
): Promise<VoiceTranscribeResponse> {
  try {
    console.log("[VoiceAPI] Transcribing audio, language:", request.languageCode || "en-IN");

    const response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        audioBase64: request.audioBase64,
        languageCode: request.languageCode || "en-IN",
        encoding: request.encoding,
        sampleRateHertz: request.sampleRateHertz,
        enableSpeakerDiarization: request.enableSpeakerDiarization ?? true,
        minSpeakerCount: request.minSpeakerCount || 1,
        maxSpeakerCount: request.maxSpeakerCount || 6,
        enableAutomaticPunctuation: request.enableAutomaticPunctuation ?? true,
        model: request.model || "latest_long",
      }),
    });

    const data = await handleResponse<VoiceTranscribeResponse>(response);
    console.log(
      "[VoiceAPI] Transcription complete:",
      data.segments?.length || 0,
      "segments,",
      data.speakerCount || 0,
      "speakers"
    );
    return data;
  } catch (error) {
    console.error("[VoiceAPI] Error transcribing audio:", error);
    throw error;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert a Blob to base64 string (without data URL prefix)
 * 
 * @param blob - Audio blob to convert
 * @returns Base64-encoded string
 */
export function blobToBase64(blob: Blob): Promise<string> {
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

/**
 * Convert base64 audio to a playable Blob
 * 
 * @param base64 - Base64-encoded audio
 * @param contentType - MIME type (e.g., "audio/mp3")
 * @returns Audio Blob
 */
export function base64ToBlob(base64: string, contentType: string = "audio/mp3"): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Create an audio URL from base64 data for playback
 * 
 * @param base64 - Base64-encoded audio
 * @param contentType - MIME type
 * @returns Object URL for the audio
 */
export function createAudioUrl(base64: string, contentType: string = "audio/mp3"): string {
  const blob = base64ToBlob(base64, contentType);
  return URL.createObjectURL(blob);
}

/**
 * Play synthesized audio from base64 data
 * 
 * @param base64 - Base64-encoded audio
 * @param contentType - MIME type
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudio(base64: string, contentType: string = "audio/mp3"): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioUrl = createAudioUrl(base64, contentType);
    const audio = new Audio(audioUrl);
    
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

/**
 * Generate a unique session ID for voice processing
 * 
 * @returns UUID string
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Available voice options for text-to-speech synthesis
 */
export const AVAILABLE_VOICES: VoiceOption[] = [
  // Indian English
  { id: "en-IN-Wavenet-A", name: "Indian English - Female 1", languageCode: "en-IN", gender: "FEMALE", type: "WAVENET" },
  { id: "en-IN-Wavenet-B", name: "Indian English - Male 1", languageCode: "en-IN", gender: "MALE", type: "WAVENET" },
  { id: "en-IN-Wavenet-C", name: "Indian English - Male 2", languageCode: "en-IN", gender: "MALE", type: "WAVENET" },
  { id: "en-IN-Wavenet-D", name: "Indian English - Female 2", languageCode: "en-IN", gender: "FEMALE", type: "WAVENET" },
  { id: "en-IN-Neural2-A", name: "Indian English - Neural Female", languageCode: "en-IN", gender: "FEMALE", type: "NEURAL2" },
  { id: "en-IN-Neural2-B", name: "Indian English - Neural Male", languageCode: "en-IN", gender: "MALE", type: "NEURAL2" },
  
  // US English
  { id: "en-US-Wavenet-A", name: "US English - Male 1", languageCode: "en-US", gender: "MALE", type: "WAVENET" },
  { id: "en-US-Wavenet-C", name: "US English - Female 1", languageCode: "en-US", gender: "FEMALE", type: "WAVENET" },
  { id: "en-US-Neural2-A", name: "US English - Neural Male", languageCode: "en-US", gender: "MALE", type: "NEURAL2" },
  { id: "en-US-Neural2-C", name: "US English - Neural Female", languageCode: "en-US", gender: "FEMALE", type: "NEURAL2" },
  
  // Hindi
  { id: "hi-IN-Wavenet-A", name: "Hindi - Female", languageCode: "hi-IN", gender: "FEMALE", type: "WAVENET" },
  { id: "hi-IN-Wavenet-B", name: "Hindi - Male", languageCode: "hi-IN", gender: "MALE", type: "WAVENET" },
  { id: "hi-IN-Neural2-A", name: "Hindi - Neural Female", languageCode: "hi-IN", gender: "FEMALE", type: "NEURAL2" },
  { id: "hi-IN-Neural2-B", name: "Hindi - Neural Male", languageCode: "hi-IN", gender: "MALE", type: "NEURAL2" },
];

/**
 * Available languages for transcription
 */
export const TRANSCRIPTION_LANGUAGES: LanguageOption[] = [
  { code: "en-IN", name: "English (India)", isDefault: true },
  { code: "en-US", name: "English (United States)" },
  { code: "en-GB", name: "English (United Kingdom)" },
  { code: "hi-IN", name: "Hindi" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "mr-IN", name: "Marathi" },
  { code: "gu-IN", name: "Gujarati" },
  { code: "bn-IN", name: "Bengali" },
  { code: "pa-IN", name: "Punjabi" },
];

/**
 * Default transcription settings
 */
export const DEFAULT_TRANSCRIPTION_SETTINGS = {
  languageCode: "en-IN",
  enableSpeakerDiarization: true,
  minSpeakerCount: 1,
  maxSpeakerCount: 6,
  enableAutomaticPunctuation: true,
  model: "latest_long",
};

// =============================================================================
// Export Default API Object
// =============================================================================

const VoiceAPI = {
  // Main API functions
  processVoice,
  synthesizeSpeech,
  transcribeAudio,
  
  // Utility functions
  blobToBase64,
  base64ToBlob,
  createAudioUrl,
  playAudio,
  generateSessionId,
  
  // Constants
  AVAILABLE_VOICES,
  TRANSCRIPTION_LANGUAGES,
  DEFAULT_TRANSCRIPTION_SETTINGS,
};

export default VoiceAPI;
