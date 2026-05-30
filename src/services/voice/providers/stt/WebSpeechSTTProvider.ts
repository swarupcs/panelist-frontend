/**
 * WebSpeechSTTProvider
 *
 * Speech-to-Text using the browser's built-in Web Speech API.
 * Works on Chrome and Edge. No API key required. 100% free.
 *
 * KNOWN LIMITATIONS (documented — see analysis):
 *   - Chrome/Edge only
 *   - Auto-stops after silence; we restart it automatically
 *   - Audio processed by Google's servers
 *   - Poor accuracy for technical jargon
 *
 * TO SWAP IN DEEPGRAM:
 *   Change VoiceProviderFactory to use DeepgramSTTProvider instead.
 *   This file is untouched.
 *
 * TO SWAP IN GEMINI LIVE:
 *   Change VoiceProviderFactory to use GeminiSTTProvider instead.
 *   This file is untouched.
 */

import type { ISTTProvider } from '../../ISTTProvider';
import type { STTEvents, STTStatus } from '../../types';

// Extend window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export class WebSpeechSTTProvider implements ISTTProvider {
  readonly name = 'Web Speech API (STT)';

  private recognition: SpeechRecognition | null = null;
  private status: STTStatus = 'idle';
  private language = 'en-US';
  /** Keep restarting on silence until stopListening() is called */
  private shouldKeepListening = false;
  private currentEvents: STTEvents | null = null;

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  async startListening(events: STTEvents): Promise<void> {
    if (!this.isSupported()) {
      this.status = 'error';
      events.onError('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
      events.onStatusChange('error');
      return;
    }

    this.currentEvents = events;
    this.shouldKeepListening = true;
    this.initRecognition(events);
    this.recognition!.start();
  }

  stopListening(): void {
    this.shouldKeepListening = false;
    this.recognition?.stop();
    this.status = 'idle';
    this.currentEvents?.onStatusChange('idle');
    this.recognition = null;
    this.currentEvents = null;
  }

  abort(): void {
    this.shouldKeepListening = false;
    this.recognition?.abort();
    this.status = 'idle';
    this.recognition = null;
    this.currentEvents = null;
  }

  getStatus(): STTStatus {
    return this.status;
  }

  getSupportedLanguages(): string[] {
    return ['en-US', 'en-GB', 'en-IN', 'hi-IN'];
  }

  setLanguage(lang: string): void {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private initRecognition(events: STTEvents) {
    const SpeechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.status = 'listening';
      events.onStatusChange('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      // Always emit interim so the UI can show live text
      if (interimTranscript) {
        events.onTranscript({
          text: interimTranscript,
          isFinal: false,
          confidence: event.results[event.resultIndex]?.[0]?.confidence,
        });
      }

      // Emit final transcript when a sentence completes
      if (finalTranscript) {
        events.onTranscript({
          text: finalTranscript.trim(),
          isFinal: true,
          confidence: event.results[event.resultIndex]?.[0]?.confidence,
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is not a real error — just silence, restart quietly
      if (event.error === 'no-speech') {
        this.restartIfNeeded(events);
        return;
      }
      this.status = 'error';
      events.onStatusChange('error');
      events.onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      // Auto-restart to work around the silence timeout limitation
      this.restartIfNeeded(events);
    };

    this.recognition = recognition;
  }

  private restartIfNeeded(events: STTEvents) {
    if (!this.shouldKeepListening) return;
    try {
      // Small delay to avoid rapid restart loop
      setTimeout(() => {
        if (!this.shouldKeepListening) return;
        this.recognition = null;
        this.initRecognition(events);
        this.recognition!.start();
      }, 300);
    } catch {
      // Ignore restart errors
    }
  }
}
