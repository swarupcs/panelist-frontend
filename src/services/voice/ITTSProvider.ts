/**
 * ITTSProvider — Text-to-Speech Provider Interface
 *
 * Every TTS implementation (Web Speech API, ElevenLabs, Google Cloud TTS,
 * Azure Cognitive Speech) must implement this interface.
 *
 * HOW TO ADD A NEW PROVIDER:
 *   1. Create  src/services/voice/providers/tts/YourProviderTTS.ts
 *   2. Implement ITTSProvider
 *   3. Register it in VoiceProviderFactory.ts
 *   4. Add its key to TTSProviderType in types.ts
 */

import type { TTSEvents, TTSOptions, TTSStatus } from './types';

export interface ITTSProvider {
  /** Human-readable name for debugging / UI display */
  readonly name: string;

  /** Whether this provider is supported in the current environment */
  isSupported(): boolean;

  /**
   * Speak the given text.
   * Must call events.onSpeakStart() and events.onSpeakEnd() appropriately.
   */
  speak(text: string, events: TTSEvents, options?: TTSOptions): Promise<void>;

  /** Stop speaking immediately. */
  stop(): void;

  /** Whether the provider is currently speaking. */
  isSpeaking(): boolean;

  /** Current status */
  getStatus(): TTSStatus;

  /** Optional: list available voices */
  getVoices?(): Promise<{ id: string; name: string; lang: string }[]>;
}
