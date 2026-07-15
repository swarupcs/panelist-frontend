/**
 * GoogleTTSProvider — STUB
 *
 * High-quality Neural2 voices via Google Cloud Text-to-Speech.
 * Free tier: 1,000,000 chars/month (Standard voices) — very generous.
 *
 * HOW TO ACTIVATE:
 *   1. Enable Cloud TTS API in Google Cloud Console
 *   2. Create an API key restricted to Cloud TTS
 *   3. Add VITE_GOOGLE_TTS_API_KEY=your_key to frontend .env
 *   4. In VoiceProviderFactory, change ttsProvider: 'google'
 *   5. Implement the fetch below
 *
 * Google TTS docs: https://cloud.google.com/text-to-speech/docs/reference/rest
 */

import type { ITTSProvider } from '../../ITTSProvider';
import type { TTSEvents, TTSOptions, TTSStatus } from '../../types';

export class GoogleTTSProvider implements ITTSProvider {
  readonly name = 'Google Cloud TTS';

  private status: TTSStatus = 'idle';
  private apiKey: string;
  private audio: HTMLAudioElement | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isSupported(): boolean {
    return typeof fetch !== 'undefined' && typeof Audio !== 'undefined';
  }

  async speak(text: string, events: TTSEvents, options?: TTSOptions): Promise<void> {
    if (!this.apiKey) {
      events.onError('Google TTS API key not configured. Set VITE_GOOGLE_TTS_API_KEY in your .env.');
      events.onStatusChange('error');
      return;
    }

    // TODO: Implement Google Cloud TTS
    // Steps:
    //   1. POST https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}
    //      Body: {
    //        input: { text },
    //        voice: { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' },
    //        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }
    //      }
    //   2. Response has audioContent (base64 MP3)
    //   3. Create Audio element, set src to data:audio/mp3;base64,${audioContent}
    //   4. Play and call events.onSpeakStart() / onSpeakEnd()

    events.onError('Google TTS provider is not yet implemented.');
    events.onStatusChange('error');
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.status = 'idle';
  }

  isSpeaking(): boolean {
    return this.status === 'speaking';
  }

  getStatus(): TTSStatus {
    return this.status;
  }
}
