/**
 * useVoiceInterview
 *
 * React hook that manages the VoiceAgentClient lifecycle.
 * The component only deals with state & callbacks — all provider
 * details are hidden inside VoiceProviderFactory and VoiceAgentClient.
 *
 * Usage:
 *   const { state, connect, startSpeaking, submitAnswer, … } = useVoiceInterview(sessionId);
 *
 * To swap providers: set VITE_STT_PROVIDER / VITE_TTS_PROVIDER in .env
 * No code changes needed.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { VoiceAgentClient }     from '@/services/voice/VoiceAgentClient';
import { VoiceProviderFactory } from '@/services/voice/VoiceProviderFactory';
import type { VoiceInterviewState } from '@/services/voice/types';
import { useAuthStore } from '@/store/authStore';

const WS_BASE_URL =
  (import.meta.env.VITE_WS_URL as string) ??
  `ws://localhost:${import.meta.env.VITE_PORT ?? 3000}`;

const INITIAL_STATE: VoiceInterviewState = {
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

export function useVoiceInterview(sessionId: string | undefined) {
  const [state, setState] = useState<VoiceInterviewState>(INITIAL_STATE);
  const [errors, setErrors] = useState<string[]>([]);
  const clientRef = useRef<VoiceAgentClient | null>(null);
  const { tokens } = useAuthStore();
  const accessToken = tokens?.accessToken;

  // ── Connect on mount / sessionId change ────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !accessToken) return;

    const stt    = VoiceProviderFactory.createSTTProvider();
    const tts    = VoiceProviderFactory.createTTSProvider();
    const client = new VoiceAgentClient(
      stt,
      tts,
      `${WS_BASE_URL}/voice`,
      {
        onStateChange: (s) => setState({ ...s }),
        onError: (msg)     => setErrors(prev => [...prev, msg]),
      },
    );

    clientRef.current = client;
    client.connect(sessionId, accessToken);

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [sessionId, accessToken]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startSpeaking = useCallback(() => {
    clientRef.current?.startSpeaking();
  }, []);

  const submitAnswer = useCallback(() => {
    clientRef.current?.submitAnswer();
  }, []);

  const requestHint = useCallback(() => {
    clientRef.current?.requestHint();
  }, []);

  const pause = useCallback(() => {
    clientRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    clientRef.current?.resume();
  }, []);

  const end = useCallback(() => {
    clientRef.current?.end();
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  // ── Provider info for UI ──────────────────────────────────────────────────
  const sttProviderName = clientRef.current?.getSTTProviderName() ?? 'Web Speech API (STT)';
  const ttsProviderName = clientRef.current?.getTTSProviderName() ?? 'Web Speech API (TTS)';

  return {
    state,
    errors,
    clearErrors,
    // Actions
    startSpeaking,
    submitAnswer,
    requestHint,
    pause,
    resume,
    end,
    // Info
    sttProviderName,
    ttsProviderName,
    // Convenience derived state
    isConnecting:   state.phase === 'connecting',
    isAISpeaking:   state.phase === 'ai_speaking',
    isListening:    state.phase === 'user_speaking',
    isThinking:     state.phase === 'ai_thinking',
    isPaused:       state.phase === 'paused',
    isCompleted:    state.phase === 'completed',
    isError:        state.phase === 'error',
    isFeedback:     state.phase === 'feedback',
  };
}
