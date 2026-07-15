/**
 * DeepgramSTTProvider — STUB
 *
 * Real-time Speech-to-Text via Deepgram's streaming WebSocket API.
 * Superior accuracy for technical jargon (O(n log n), useEffect, etc.)
 * Sub-300ms latency. $200 free credits, no card required.
 *
 * HOW TO ACTIVATE:
 *   1. Sign up at https://deepgram.com and get your API key
 *   2. Add VITE_DEEPGRAM_API_KEY=your_key to frontend .env
 *   3. In VoiceProviderFactory, change sttProvider: 'deepgram'
 *   4. Implement the WebSocket streaming logic below
 *
 * Deepgram streaming docs: https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio
 */

import type { ISTTProvider } from '../../ISTTProvider';
import type { STTEvents, STTStatus } from '../../types';

export class DeepgramSTTProvider implements ISTTProvider {
  readonly name = 'Deepgram (STT)';

  private status: STTStatus = 'idle';
  private apiKey: string;
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private language = 'en-US';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isSupported(): boolean {
    return typeof WebSocket !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }

  async startListening(events: STTEvents): Promise<void> {
    if (!this.apiKey) {
      events.onError('Deepgram API key not configured. Set VITE_DEEPGRAM_API_KEY in your .env file.');
      events.onStatusChange('error');
      return;
    }

    // TODO: Implement Deepgram streaming WebSocket
    // Steps:
    //   1. Get microphone stream: navigator.mediaDevices.getUserMedia({ audio: true })
    //   2. Connect to Deepgram WS: wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US
    //      with Authorization header: Token ${this.apiKey}
    //   3. Pipe MediaRecorder output to the WebSocket
    //   4. Parse incoming JSON messages for transcript results
    //   5. Call events.onTranscript({ text, isFinal, confidence })

    events.onError('Deepgram STT provider is not yet implemented. Use WebSpeechSTTProvider for now.');
    events.onStatusChange('error');
  }

  stopListening(): void {
    this.ws?.close();
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach(t => t.stop());
    this.ws = null;
    this.mediaRecorder = null;
    this.stream = null;
    this.status = 'idle';
  }

  abort(): void {
    this.stopListening();
  }

  getStatus(): STTStatus {
    return this.status;
  }

  setLanguage(lang: string): void {
    this.language = lang;
  }
}
