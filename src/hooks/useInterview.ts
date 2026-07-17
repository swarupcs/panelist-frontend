// src/hooks/useInterview.ts
// UPDATE: useStartInterview now forwards focusAreas from StartInterviewRequest.
// All other hooks unchanged from the previous version.

import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '@/api/interview.api';
import { useInterviewStore } from '@/store/interviewStore';
import { queryClient } from '@/lib/queryClient';
import type {
  StartInterviewRequest,
  SubmitAnswerRequest,
  InterviewType,
  Difficulty,
} from '@/types';

// ── Start ──────────────────────────────────────────────────────────────────

export function useStartInterview() {
  const { startSession } = useInterviewStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: StartInterviewRequest) =>
      interviewApi.startInterview(data),
    onSuccess: (data, variables) => {
      startSession({
        sessionId: data.sessionId,
        type: data.type as InterviewType,
        difficulty: (variables.difficulty ?? 'medium') as Difficulty,
        currentQuestion: data.currentQuestion,
        totalQuestions: data.totalQuestions,
      });
      navigate(`/interview/${data.sessionId}`);
    },
  });
}

// ── Submit answer ──────────────────────────────────────────────────────────

export function useSubmitAnswer() {
  const {
    recordAnswer,
    setCurrentQuestion,
    completeSession,
    currentQuestionIndex,
  } = useInterviewStore();

  return useMutation({
    mutationFn: (data: SubmitAnswerRequest) => interviewApi.submitAnswer(data),
    onSuccess: (data, variables) => {
      recordAnswer(
        variables.sessionId,
        variables.answer,
        data.score,
        data.feedback,
      );

      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion, currentQuestionIndex + 1);
      } else {
        completeSession(0); // real score fetched from /results
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      }
    },
  });
}

// ── Skip question ──────────────────────────────────────────────────────────

export function useSkipQuestion() {
  const {
    recordAnswer,
    setCurrentQuestion,
    completeSession,
    currentQuestion,
    currentQuestionIndex,
  } = useInterviewStore();

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.skipQuestion(sessionId),
    onSuccess: (data) => {
      if (currentQuestion) {
        recordAnswer(currentQuestion.id, '[SKIPPED]', 0, 'Question skipped');
      }
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion, currentQuestionIndex + 1);
      } else {
        completeSession(0);
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      }
    },
  });
}

// ── End interview ──────────────────────────────────────────────────────────

export function useEndInterview() {
  const { abandonSession } = useInterviewStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.endInterview(sessionId),
    onSuccess: (_data, sessionId) => {
      abandonSession();
      // Clear setup flags so a new session starts clean
      sessionStorage.removeItem('interview_isTimed');
      sessionStorage.removeItem('interview_adaptiveMode');
      navigate(`/interview/results/${sessionId}`);
    },
  });
}

// ── Hint ───────────────────────────────────────────────────────────────────

export function useRequestHint(sessionId: string) {
  return useMutation({
    mutationFn: () => interviewApi.getHint(sessionId),
  });
}

// ── Session status ─────────────────────────────────────────────────────────

export function useSessionStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'session', sessionId],
    queryFn: () => interviewApi.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });
}

// ── Results ────────────────────────────────────────────────────────────────

export function useSessionResults(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'results', sessionId],
    queryFn: () => interviewApi.getResults(sessionId!),
    enabled: !!sessionId,
    staleTime: Infinity, // results are immutable once COMPLETED
  });
}

// ── Timer ──────────────────────────────────────────────────────────────────

export function useTimerStatus(sessionId: string | null, enabled = false) {
  return useQuery({
    queryKey: ['interview', 'timer', sessionId],
    queryFn: () => interviewApi.getTimerStatus(sessionId!),
    enabled: !!sessionId && enabled,
    refetchInterval: 5000,
  });
}

// ── Pause / resume ─────────────────────────────────────────────────────────

export function usePauseSession() {
  const { setPaused } = useInterviewStore();
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.pauseSession(sessionId),
    onSuccess: () => setPaused(true),
  });
}

export function useResumeSession() {
  const { setPaused } = useInterviewStore();
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.resumeSession(sessionId),
    onSuccess: () => setPaused(false),
  });
}

// ── Replay ─────────────────────────────────────────────────────────────────

export function useReplayHistory() {
  return useQuery({
    queryKey: ['interview', 'replay', 'history'],
    queryFn: interviewApi.getReplayHistory,
  });
}

export function useReplay(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'replay', sessionId],
    queryFn: () => interviewApi.getReplay(sessionId!),
    enabled: !!sessionId,
  });
}

// ── Compare attempts ───────────────────────────────────────────────────────

export function useCompareAttempts(
  sessionId1: string | null,
  sessionId2: string | null,
) {
  return useQuery({
    queryKey: ['interview', 'compare', sessionId1, sessionId2],
    queryFn: () => interviewApi.compareAttempts(sessionId1!, sessionId2!),
    enabled: !!sessionId1 && !!sessionId2,
    staleTime: Infinity,
  });
}

// ── Question rating ────────────────────────────────────────────────────────

export function useRateQuestion() {
  return useMutation({
    mutationFn: ({
      questionId,
      rating,
      comment,
    }: {
      questionId: string;
      rating: number;
      comment?: string;
    }) => interviewApi.rateQuestion(questionId, rating, comment),
    throwOnError: false,
  });
}
