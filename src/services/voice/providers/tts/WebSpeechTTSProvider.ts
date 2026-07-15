/**
 * WebSpeechTTSProvider
 *
 * Text-to-Speech using the browser's built-in SpeechSynthesis API.
 * Works on all modern browsers. No API key required. 100% free.
 * Voice quality is OS-dependent (varies across Windows/Mac/Android).
 */

import type { ITTSProvider } from '../../ITTSProvider';
import type { TTSEvents, TTSOptions, TTSStatus } from '../../types';

export class WebSpeechTTSProvider implements ITTSProvider {
  readonly name = 'Web Speech API (TTS)';

  private status: TTSStatus = 'idle';
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async speak(text: string, events: TTSEvents, options?: TTSOptions): Promise<void> {
    if (!this.isSupported()) {
      this.status = 'error';
      events.onStatusChange('error');
      events.onError('SpeechSynthesis is not supported in this browser.');
      return;
    }

    // Cancel any currently speaking utterance
    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply options
      utterance.rate   = options?.rate   ?? 0.95;  // Slightly slower than default
      utterance.pitch  = options?.pitch  ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;
      utterance.lang   = 'en-US';

      // Try to use a natural-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = this.pickBestVoice(voices, options?.voiceId);
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        this.status = 'speaking';
        events.onStatusChange('speaking');
        events.onSpeakStart(text);
      };

      utterance.onend = () => {
        this.status = 'idle';
        this.currentUtterance = null;
        events.onStatusChange('idle');
        events.onSpeakEnd(text);
        resolve();
      };

      utterance.onerror = (e) => {
        // 'interrupted' fires when stop() is called — not a real error
        if (e.error === 'interrupted' || e.error === 'canceled') {
          resolve();
          return;
        }
        this.status = 'error';
        this.currentUtterance = null;
        events.onStatusChange('error');
        events.onError(`TTS error: ${e.error}`);
        resolve();
      };

      // Chrome bug: voices may not be loaded yet
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const loadedVoices = window.speechSynthesis.getVoices();
          const v = this.pickBestVoice(loadedVoices, options?.voiceId);
          if (v) utterance.voice = v;
          window.speechSynthesis.speak(utterance);
        };
      } else {
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  stop(): void {
    window.speechSynthesis?.cancel();
    this.status = 'idle';
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.status === 'speaking';
  }

  getStatus(): TTSStatus {
    return this.status;
  }

  async getVoices(): Promise<{ id: string; name: string; lang: string }[]> {
    const voices = window.speechSynthesis.getVoices();
    return voices.map(v => ({ id: v.voiceURI, name: v.name, lang: v.lang }));
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private pickBestVoice(
    voices: SpeechSynthesisVoice[],
    preferredId?: string,
  ): SpeechSynthesisVoice | null {
    if (!voices.length) return null;

    // User-specified voice
    if (preferredId) {
      const found = voices.find(v => v.voiceURI === preferredId);
      if (found) return found;
    }

    // Prefer natural/neural English voices
    const preferred = [
      'Samantha',          // macOS natural
      'Google US English', // Chrome
      'Microsoft Aria',    // Windows Edge
      'Microsoft Jenny',   // Windows Edge
      'en-US',             // generic fallback
    ];

    for (const name of preferred) {
      const match = voices.find(v => v.name.includes(name) || v.lang === name);
      if (match) return match;
    }

    // Last resort: any English voice
    return voices.find(v => v.lang.startsWith('en')) ?? voices[0];
  }
}
