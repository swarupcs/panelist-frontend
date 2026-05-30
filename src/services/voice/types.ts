/**
 * Voice Service — Shared Types
 *
 * These types are used across all STT/TTS providers and the VoiceAgentClient.
 * Adding a new provider (Deepgram, Gemini Live, etc.) only requires
 * implementing ISTTProvider / ITTSProvider — nothing else changes.
 */

// ── STT ──────────────────────────────────────────────────────────────────────

/** A single transcript result from the STT engine */
export interface TranscriptResult {
  text: string;
  /** true = sentence complete, false = interim (still speaking) */
  isFinal: boolean;
  /** Confidence 0-1, if the provider supports it */
  confidence?: number;
}

export type STTStatus = 'idle' | 'listening' | 'processing' | 'error';

/** Events emitted by an ISTTProvider */
export interface STTEvents {
  onTranscript: (result: TranscriptResult) => void;
  onStatusChange: (status: STTStatus) => void;
  onError: (error: string) => void;
}

// ── TTS ──────────────────────────────────────────────────────────────────────

export type TTSStatus = 'idle' | 'speaking' | 'error';

/** Events emitted by an ITTSProvider */
export interface TTSEvents {
  onStatusChange: (status: TTSStatus) => void;
  onSpeakStart: (text: string) => void;
  onSpeakEnd: (text: string) => void;
  onError: (error: string) => void;
}

export interface TTSOptions {
  /** Voice ID / name — provider-specific */
  voiceId?: string;
  /** Speech rate: 0.5 = slow, 1.0 = normal, 2.0 = fast */
  rate?: number;
  /** Pitch: 0 = low, 1 = normal, 2 = high */
  pitch?: number;
  /** Volume: 0.0 – 1.0 */
  volume?: number;
}

// ── Voice Agent State ─────────────────────────────────────────────────────────

export type VoicePhase =
  | 'connecting'       // WebSocket connecting
  | 'ready'            // AI is about to ask a question
  | 'ai_speaking'      // TTS is playing AI question/feedback
  | 'user_speaking'    // STT is listening to candidate
  | 'ai_thinking'      // Answer sent, awaiting LLM response
  | 'feedback'         // AI is delivering feedback (TTS)
  | 'paused'           // Interview paused
  | 'completed'        // Session finished
  | 'error';           // Something went wrong

export interface VoiceInterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
}

export interface VoiceInterviewState {
  phase: VoicePhase;
  currentQuestion: VoiceInterviewQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  currentTranscript: string;    // live interim text
  lastScore: number | null;
  lastFeedback: string | null;
  overallScore: number | null;
  overallFeedback: string | null;
  errorMessage: string | null;
  hintsUsed: number;
}

// ── Provider Config ───────────────────────────────────────────────────────────

/** Provider identifiers — add new ones here as you integrate them */
export type STTProviderType = 'webspeech' | 'deepgram' | 'gemini' | 'whisper';
export type TTSProviderType = 'webspeech' | 'elevenlabs' | 'google' | 'azure';

export interface VoiceConfig {
  sttProvider: STTProviderType;
  ttsProvider: TTSProviderType;
  /** Provider-specific API keys / options */
  sttOptions?: Record<string, unknown>;
  ttsOptions?: TTSOptions & Record<string, unknown>;
  /** ws:// or wss:// URL for the backend */
  wsUrl: string;
}
