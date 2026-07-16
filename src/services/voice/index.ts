/**
 * Voice Service — Barrel Export
 *
 * Import everything voice-related from '@/services/voice'
 */

export type { ISTTProvider } from './ISTTProvider';
export type { ITTSProvider } from './ITTSProvider';
export type {
  TranscriptResult,
  STTStatus,
  TTSStatus,
  STTEvents,
  TTSEvents,
  TTSOptions,
  VoicePhase,
  VoiceInterviewQuestion,
  VoiceInterviewState,
  VoiceConfig,
  STTProviderType,
  TTSProviderType,
} from './types';

export { VoiceAgentClient }     from './VoiceAgentClient';
export { VoiceProviderFactory } from './VoiceProviderFactory';

// Providers (for direct instantiation if needed)
export { WebSpeechSTTProvider }  from './providers/stt/WebSpeechSTTProvider';
export { DeepgramSTTProvider }   from './providers/stt/DeepgramSTTProvider';
export { GeminiSTTProvider }     from './providers/stt/GeminiSTTProvider';
export { WebSpeechTTSProvider }  from './providers/tts/WebSpeechTTSProvider';
export { ElevenLabsTTSProvider } from './providers/tts/ElevenLabsTTSProvider';
export { GoogleTTSProvider }     from './providers/tts/GoogleTTSProvider';
