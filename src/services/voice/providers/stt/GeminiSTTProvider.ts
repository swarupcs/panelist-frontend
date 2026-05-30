/**
 * GeminiSTTProvider — STUB
 *
 * Real-time Speech-to-Text + LLM via Google Gemini Live API.
 * Gemini Live can handle BOTH the STT and the AI conversation in one stream —
 * meaning for Gemini Live, you might bypass the backend WebSocket entirely
 * and run the whole interview conversation client-side via Gemini Live.
 *
 * HOW TO ACTIVATE:
 *   1. Get a Gemini API key: https://aistudio.google.com
 *   2. Add VITE_GEMINI_API_KEY=your_key to frontend .env
 *   3. In VoiceProviderFactory, change sttProvider: 'gemini'
 *   4. Implement the Live API WebSocket below
 *
 * Gemini Live API docs:
 *   https://ai.google.dev/api/live
 *   https://ai.google.dev/gemini-api/docs/live-guide
 *
 * NOTE: When using Gemini Live, you may want to set ttsProvider: 'webspeech'
 * since Gemini Live can also return audio directly (AudioOutput).
 */

import type { ISTTProvider } from '../../ISTTProvider';
import type { STTEvents, STTStatus } from '../../types';

export class GeminiSTTProvider implements ISTTProvider {
  readonly name = 'Gemini Live API (STT)';

  private status: STTStatus = 'idle';
  private apiKey: string;
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isSupported(): boolean {
    return typeof WebSocket !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }

  async startListening(events: STTEvents): Promise<void> {
    if (!this.apiKey) {
      events.onError('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.');
      events.onStatusChange('error');
      return;
    }

    // TODO: Implement Gemini Live WebSocket streaming
    // Gemini Live API endpoint:
    //   wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}
    //
    // Steps:
    //   1. Connect to the WS above
    //   2. Send setup message with model config and tools
    //   3. Get mic audio: navigator.mediaDevices.getUserMedia({ audio: true })
    //   4. Stream PCM audio chunks to WS as realtimeInput.mediaChunks
    //   5. Parse responses for serverContent.modelTurn.parts[].text (transcript)
    //      or serverContent.modelTurn.parts[].inlineData (audio output)
    //   6. Call events.onTranscript({ text, isFinal })
    //
    // Advanced: Gemini Live can ALSO generate responses — you can use it
    // as both STT and the AI interviewer, replacing the backend WS entirely.

    events.onError('Gemini Live STT provider is not yet implemented.');
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
}
