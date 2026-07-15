/**
 * VoiceProviderFactory
 *
 * Single place to instantiate STT and TTS providers.
 * To switch providers, change VITE_STT_PROVIDER / VITE_TTS_PROVIDER in .env
 * OR pass config explicitly to createSTTProvider / createTTSProvider.
 *
 * ENV VARS:
 *   VITE_STT_PROVIDER         = webspeech | deepgram | gemini     (default: webspeech)
 *   VITE_TTS_PROVIDER         = webspeech | elevenlabs | google    (default: webspeech)
 *   VITE_DEEPGRAM_API_KEY     = dg_…
 *   VITE_GEMINI_API_KEY       = AIza…
 *   VITE_ELEVENLABS_API_KEY   = …
 *   VITE_ELEVENLABS_VOICE_ID  = …
 *   VITE_GOOGLE_TTS_API_KEY   = AIza…
 */

import type { ISTTProvider } from './ISTTProvider';
import type { ITTSProvider } from './ITTSProvider';
import type { STTProviderType, TTSProviderType } from './types';

import { WebSpeechSTTProvider }  from './providers/stt/WebSpeechSTTProvider';
import { DeepgramSTTProvider }   from './providers/stt/DeepgramSTTProvider';
import { GeminiSTTProvider }     from './providers/stt/GeminiSTTProvider';

import { WebSpeechTTSProvider }  from './providers/tts/WebSpeechTTSProvider';
import { ElevenLabsTTSProvider } from './providers/tts/ElevenLabsTTSProvider';
import { GoogleTTSProvider }     from './providers/tts/GoogleTTSProvider';

export class VoiceProviderFactory {
  static createSTTProvider(type?: STTProviderType): ISTTProvider {
    const providerType: STTProviderType =
      type ??
      (import.meta.env.VITE_STT_PROVIDER as STTProviderType) ??
      'webspeech';

    switch (providerType) {
      case 'deepgram':
        return new DeepgramSTTProvider(import.meta.env.VITE_DEEPGRAM_API_KEY ?? '');

      case 'gemini':
        return new GeminiSTTProvider(import.meta.env.VITE_GEMINI_API_KEY ?? '');

      case 'webspeech':
      default:
        return new WebSpeechSTTProvider();
    }
  }

  static createTTSProvider(type?: TTSProviderType): ITTSProvider {
    const providerType: TTSProviderType =
      type ??
      (import.meta.env.VITE_TTS_PROVIDER as TTSProviderType) ??
      'webspeech';

    switch (providerType) {
      case 'elevenlabs':
        return new ElevenLabsTTSProvider(
          import.meta.env.VITE_ELEVENLABS_API_KEY ?? '',
          import.meta.env.VITE_ELEVENLABS_VOICE_ID,
        );

      case 'google':
        return new GoogleTTSProvider(import.meta.env.VITE_GOOGLE_TTS_API_KEY ?? '');

      case 'webspeech':
      default:
        return new WebSpeechTTSProvider();
    }
  }
}
