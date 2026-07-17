/**
 * VoiceAgentClient
 *
 * The main orchestrator for voice interviews. It:
 *  1. Connects to the backend WebSocket at /voice
 *  2. Uses an ISTTProvider to capture speech → sends transcript to backend
 *  3. Receives AI responses from backend → uses ITTSProvider to speak them
 *  4. Manages the full voice interview state machine
 *
 * State machine:
 *   connecting → ready → ai_speaking → user_speaking → ai_thinking
 *             → feedback (ai_speaking) → next question → … → completed
 *
 * SWAPPING PROVIDERS:
 *   Just pass different ISTTProvider / ITTSProvider implementations.
 *   This class has zero knowledge of Web Speech API, Deepgram, or Gemini.
 */

import type { ISTTProvider } from './ISTTProvider';
import type { ITTSProvider } from './ITTSProvider';
import type { STTEvents, TTSEvents, VoiceInterviewState, VoicePhase } from './types';

// Frontend-only version of the server events type
interface IVoiceSessionEvents {
  onStateChange: (state: VoiceInterviewState) => void;
  onError: (message: string) => void;
}

// ── Duplicate of backend type (keep in sync) ─────────────────────────────────
// We define it here again to avoid importing from the backend
type WsServerEvent =
  | { type: 'SESSION_READY';    sessionId: string; question: any; questionIndex: number; totalQuestions: number }
  | { type: 'AI_THINKING' }
  | { type: 'AI_RESPONSE';      text: string; isQuestion: boolean }
  | { type: 'HINT';             text: string; hintsUsed: number }
  | { type: 'ANSWER_EVALUATED'; score: number; feedback: string; nextQuestion: any | null; sessionCompleted: boolean; questionIndex: number }
  | { type: 'SESSION_PAUSED' }
  | { type: 'SESSION_RESUMED' }
  | { type: 'SESSION_COMPLETE'; sessionId: string; overallScore: number; feedback: string }
  | { type: 'ERROR';            code: string; message: string }
  | { type: 'PONG' };

type WsClientEvent =
  | { type: 'JOIN_SESSION';     sessionId: string; token: string }
  | { type: 'USER_TRANSCRIPT';  text: string; isFinal: boolean }
  | { type: 'REQUEST_HINT' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'END_SESSION' }
  | { type: 'PING' };

export class VoiceAgentClient {
  private stt: ISTTProvider;
  private tts: ITTSProvider;
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private callbacks: IVoiceSessionEvents;

  private state: VoiceInterviewState = {
    phase: 'connecting',
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    currentTranscript: '',
    lastScore: null,
    lastFeedback: null,
    overallScore: null,
    overallFeedback: null,
    errorMessage: null,
    hintsUsed: 0,
  };

  /** Accumulated transcript from STT while user is speaking */
  private accumulatedTranscript = '';
  /** Ping interval to keep WS alive */
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  /** Reconnection state */
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private sessionId: string | null = null;
  private token: string | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalDisconnect = false;

  constructor(
    sttProvider: ISTTProvider,
    ttsProvider: ITTSProvider,
    wsUrl: string,
    callbacks: IVoiceSessionEvents,
  ) {
    this.stt = sttProvider;
    this.tts = ttsProvider;
    this.wsUrl = wsUrl;
    this.callbacks = callbacks;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async connect(sessionId: string, token: string, isReconnect = false): Promise<void> {
    this.sessionId = sessionId;
    this.token = token;
    this.intentionalDisconnect = false;

    if (!isReconnect) {
      this.reconnectAttempts = 0;
      this.updatePhase('connecting');
    }

    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      if (isReconnect && this.state.phase === 'error') {
        // If we successfully reconnected, revert the error phase back to the previous stable state
        // For simplicity, we just set to ready, but ideally it resumes where it left off
        this.updatePhase('ready');
      }
      this.send({ type: 'JOIN_SESSION', sessionId, token });
      // Ping every 25s to prevent proxy timeouts
      this.pingInterval = setInterval(() => this.send({ type: 'PING' }), 25_000);
    };

    this.ws.onmessage = (ev) => {
      try {
        const event: WsServerEvent = JSON.parse(ev.data);
        this.handleServerEvent(event);
      } catch {
        console.error('[VoiceAgentClient] Failed to parse server message:', ev.data);
      }
    };

    this.ws.onerror = () => {
      console.error('[VoiceAgentClient] WebSocket error observed.');
    };

    this.ws.onclose = (ev) => {
      this.clearPing();
      if (this.intentionalDisconnect) return;

      if (this.state.phase !== 'completed' && this.state.phase !== 'error') {
        console.warn('[VoiceAgentClient] WebSocket closed unexpectedly:', ev.code, ev.reason);
        this.attemptReconnect();
      }
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updatePhase('error', 'Connection lost. Max reconnect attempts reached.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[VoiceAgentClient] Reconnecting... Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
    this.updatePhase('connecting', 'Connection lost. Reconnecting...');

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    this.reconnectTimeout = setTimeout(() => {
      if (this.sessionId && this.token) {
        this.connect(this.sessionId, this.token, true);
      }
    }, delay);
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    this.clearPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stt.abort();
    this.tts.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** User clicks "I'm ready" → start mic */
  startSpeaking(): void {
    if (this.state.phase !== 'ready' && this.state.phase !== 'ai_speaking') return;
    this.tts.stop(); // interrupt AI if still speaking
    this.accumulatedTranscript = '';
    this.beginListening();
  }

  /** User clicks "Done" → submit transcript */
  submitAnswer(): void {
    if (this.state.phase !== 'user_speaking') return;
    this.stt.stopListening();
    const finalText = this.accumulatedTranscript.trim() || '[no answer]';
    this.send({ type: 'USER_TRANSCRIPT', text: finalText, isFinal: true });
    this.accumulatedTranscript = '';
    this.updatePhase('ai_thinking');
  }

  requestHint(): void {
    this.send({ type: 'REQUEST_HINT' });
  }

  pause(): void {
    this.send({ type: 'PAUSE_SESSION' });
    this.stt.stopListening();
    this.tts.stop();
  }

  resume(): void {
    this.send({ type: 'RESUME_SESSION' });
  }

  end(): void {
    this.stt.stopListening();
    this.tts.stop();
    this.send({ type: 'END_SESSION' });
  }

  getState(): VoiceInterviewState {
    return { ...this.state };
  }

  getSTTProviderName(): string { return this.stt.name; }
  getTTSProviderName(): string { return this.tts.name; }

  // ── Server event handling ─────────────────────────────────────────────────

  private async handleServerEvent(event: WsServerEvent) {
    switch (event.type) {
      case 'SESSION_READY': {
        this.state.currentQuestion = event.question;
        this.state.questionIndex   = event.questionIndex;
        this.state.totalQuestions  = event.totalQuestions;
        await this.speakThenListen(event.question.question);
        break;
      }

      case 'AI_THINKING': {
        this.updatePhase('ai_thinking');
        break;
      }

      case 'AI_RESPONSE': {
        await this.speakText(event.text);
        break;
      }

      case 'HINT': {
        this.state.hintsUsed = event.hintsUsed;
        await this.speakText(`Here's a hint: ${event.text}`);
        break;
      }

      case 'ANSWER_EVALUATED': {
        this.state.lastScore    = event.score;
        this.state.lastFeedback = event.feedback;
        this.state.hintsUsed    = 0;

        const feedbackText =
          `You scored ${event.score} out of 100. ` +
          this.cleanForSpeech(event.feedback);

        if (event.sessionCompleted) {
          await this.speakText(feedbackText);
          this.updatePhase('completed');
          return;
        }

        this.state.currentQuestion = event.nextQuestion;
        this.state.questionIndex   = event.questionIndex;

        await this.speakText(feedbackText);
        await this.delay(800);
        await this.speakThenListen(event.nextQuestion?.question ?? '');
        break;
      }

      case 'SESSION_PAUSED': {
        this.updatePhase('paused');
        break;
      }

      case 'SESSION_RESUMED': {
        await this.speakThenListen(this.state.currentQuestion?.question ?? '');
        break;
      }

      case 'SESSION_COMPLETE': {
        this.state.overallScore    = event.overallScore;
        this.state.overallFeedback = event.feedback;
        await this.speakText(
          `Interview complete! Your overall score is ${Math.round(event.overallScore)} out of 100. Great job!`
        );
        this.updatePhase('completed');
        this.disconnect();
        break;
      }

      case 'ERROR': {
        console.error('[VoiceAgentClient] Server error:', event.code, event.message);
        this.updatePhase('error', event.message);
        this.callbacks.onError(event.message);
        break;
      }

      case 'PONG':
        break; // keepalive, ignore
    }
  }

  // ── STT helpers ───────────────────────────────────────────────────────────

  private beginListening() {
    this.updatePhase('user_speaking');

    const sttEvents: STTEvents = {
      onTranscript: (result) => {
        if (result.isFinal) {
          this.accumulatedTranscript += ' ' + result.text;
          // Send interim final to backend for display only
          this.send({ type: 'USER_TRANSCRIPT', text: result.text, isFinal: false });
        }
        // Update live transcript in state
        this.state.currentTranscript = this.accumulatedTranscript.trim() + ' ' + result.text;
        this.emit();
      },
      onStatusChange: (_status) => { /* phase controlled at this level */ },
      onError: (err) => {
        this.updatePhase('error', err);
        this.callbacks.onError(err);
      },
    };

    this.stt.startListening(sttEvents);
  }

  // ── TTS helpers ───────────────────────────────────────────────────────────

  private async speakThenListen(questionText: string) {
    await this.speakText(questionText);
    await this.delay(600);
    this.state.currentTranscript = '';
    this.accumulatedTranscript   = '';
    this.beginListening();
  }

  private async speakText(text: string) {
    this.updatePhase('ai_speaking');
    const ttsEvents: TTSEvents = {
      onStatusChange: () => {},
      onSpeakStart:   () => {},
      onSpeakEnd:     () => {},
      onError: (err)  => this.callbacks.onError(err),
    };
    await this.tts.speak(text, ttsEvents);
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private send(event: WsClientEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  private updatePhase(phase: VoicePhase, errorMessage?: string) {
    this.state.phase        = phase;
    this.state.errorMessage = errorMessage ?? null;
    this.emit();
  }

  private emit() {
    this.callbacks.onStateChange({ ...this.state });
  }

  private clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Strip markdown from feedback text before passing to TTS */
  private cleanForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/```[\s\S]*?```/g, 'code block omitted')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();
  }
}
