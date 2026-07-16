/**
 * ElevenLabsTTSProvider — STUB
 *
 * High-quality AI voices via ElevenLabs streaming API.
 * Free tier: 10,000 chars/month (~10 min audio). No commercial use.
 *
 * HOW TO ACTIVATE:
 *   1. Sign up at https://elevenlabs.io
 *   2. Add VITE_ELEVENLABS_API_KEY=your_key to frontend .env
 *   3. Add VITE_ELEVENLABS_VOICE_ID=your_voice_id (optional, defaults to Rachel)
 *   4. In VoiceProviderFactory, change ttsProvider: 'elevenlabs'
 *   5. Implement the streaming fetch below
 *
 * ElevenLabs streaming docs:
 *   https://elevenlabs.io/docs/api-reference/text-to-speech/convert-as-stream
 */

import type { ITTSProvider } from '../../ITTSProvider';
import type { TTSEvents, TTSOptions, TTSStatus } from '../../types';

export class ElevenLabsTTSProvider implements ITTSProvider {
  readonly name = 'ElevenLabs (TTS)';

  private status: TTSStatus = 'idle';
  private apiKey: string;
  private defaultVoiceId: string;
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(apiKey: string, defaultVoiceId = '21m00Tcm4TlvDq8ikWAM') {
    this.apiKey = apiKey;
    this.defaultVoiceId = defaultVoiceId;
  }

  isSupported(): boolean {
    return typeof fetch !== 'undefined' && typeof AudioContext !== 'undefined';
  }

  async speak(text: string, events: TTSEvents, options?: TTSOptions): Promise<void> {
    if (!this.apiKey) {
      events.onError('ElevenLabs API key not configured. Set VITE_ELEVENLABS_API_KEY in your .env.');
      events.onStatusChange('error');
      return;
    }

    // TODO: Implement ElevenLabs TTS streaming
    // Steps:
    //   1. POST to https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream
    //      with { text, model_id: 'eleven_turbo_v2', voice_settings: { stability, similarity_boost } }
    //      and header xi-api-key: this.apiKey
    //   2. Get ArrayBuffer from response
    //   3. Decode with AudioContext.decodeAudioData()
    //   4. Play with AudioBufferSourceNode
    //   5. Call events.onSpeakStart() → play → events.onSpeakEnd()

    events.onError('ElevenLabs TTS provider is not yet implemented. Using WebSpeech instead.');
    events.onStatusChange('error');
  }

  stop(): void {
    this.currentSource?.stop();
    this.currentSource = null;
    this.status = 'idle';
  }

  isSpeaking(): boolean {
    return this.status === 'speaking';
  }

  getStatus(): TTSStatus {
    return this.status;
  }

  async getVoices(): Promise<{ id: string; name: string; lang: string }[]> {
    // GET https://api.elevenlabs.io/v1/voices with xi-api-key header
    return [];
  }
}
