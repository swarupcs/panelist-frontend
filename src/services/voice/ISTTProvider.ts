/**
 * ISTTProvider — Speech-to-Text Provider Interface
 *
 * Every STT implementation (Web Speech API, Deepgram, Gemini Live, Whisper)
 * must implement this interface. The VoiceAgentClient only depends on this
 * interface — swapping providers requires zero changes to the rest of the code.
 *
 * HOW TO ADD A NEW PROVIDER:
 *   1. Create  src/services/voice/providers/stt/YourProviderSTT.ts
 *   2. Implement ISTTProvider
 *   3. Register it in VoiceProviderFactory.ts
 *   4. Add its key to STTProviderType in types.ts
 */

import type { STTEvents, STTStatus } from './types';

export interface ISTTProvider {
  /** Human-readable name for debugging / UI display */
  readonly name: string;

  /** Whether this provider is supported in the current environment */
  isSupported(): boolean;

  /**
   * Start listening for speech.
   * Provider must call events.onTranscript() as results arrive.
   */
  startListening(events: STTEvents): Promise<void>;

  /** Stop listening and clean up. */
  stopListening(): void;

  /** Immediately abort without waiting for a final transcript. */
  abort(): void;

  /** Current status */
  getStatus(): STTStatus;

  /** Optional: list available languages/locales */
  getSupportedLanguages?(): string[];

  /** Set language / locale (e.g. 'en-US') */
  setLanguage?(lang: string): void;
}
