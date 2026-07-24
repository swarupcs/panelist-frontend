// src/hooks/useInterview.ts
// UPDATE: useStartInterview now forwards focusAreas from StartInterviewRequest.
// All other hooks unchanged from the previous version.

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '@/api/interview.api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  startSession,
  setCurrentQuestion,
  recordAnswer,
  completeSession,
  abandonSession,
  setPaused,
} from '@/store/interviewSlice';
import { queryClient } from '@/lib/queryClient';
import type {
  StartInterviewRequest,
  SubmitAnswerRequest,
  InterviewType,
  Difficulty,
} from '@/types';

// ── Start ──────────────────────────────────────────────────────────────────

export function useStartInterview() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: StartInterviewRequest) =>
      interviewApi.startInterview(data),
    onSuccess: (data, variables) => {
      dispatch(
        startSession({
          sessionId: data.sessionId,
          type: data.type as InterviewType,
          difficulty: (variables.difficulty ?? 'medium') as Difficulty,
          currentQuestion: data.currentQuestion,
          totalQuestions: data.totalQuestions,
        }),
      );
      navigate(`/interview/${data.sessionId}`);
    },
    // Without this a failed start did nothing visible at all: the button
    // stopped spinning and the page sat there. The backend's messages are
    // already candidate-facing — "you have no pending topics for review", for
    // instance — so they are shown as-is rather than replaced with something
    // vaguer.
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        'Could not start the interview. Please try again.';
      toast.error(message);
    },
  });
}

// ── Submit answer ──────────────────────────────────────────────────────────

export function useSubmitAnswer() {
  const dispatch = useAppDispatch();
  const currentQuestionIndex = useAppSelector(
    (state) => state.interview.currentQuestionIndex,
  );

  return useMutation({
    mutationFn: (data: SubmitAnswerRequest) => interviewApi.submitAnswer(data),
    onSuccess: (data, variables) => {
      dispatch(
        recordAnswer({
          questionId: variables.sessionId,
          answer: variables.answer,
          score: data.score,
          feedback: data.feedback,
        }),
      );

      if (data.nextQuestion) {
        dispatch(
          setCurrentQuestion({
            question: data.nextQuestion,
            index: currentQuestionIndex + 1,
          }),
        );
      } else {
        dispatch(completeSession(0)); // real score fetched from /results
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      }
    },
  });
}

// ── Skip question ──────────────────────────────────────────────────────────

export function useSkipQuestion() {
  const dispatch = useAppDispatch();
  const currentQuestion = useAppSelector(
    (state) => state.interview.currentQuestion,
  );
  const currentQuestionIndex = useAppSelector(
    (state) => state.interview.currentQuestionIndex,
  );

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.skipQuestion(sessionId),
    onSuccess: (data) => {
      if (currentQuestion) {
        dispatch(
          recordAnswer({
            questionId: currentQuestion.id,
            answer: '[SKIPPED]',
            score: 0,
            feedback: 'Question skipped',
          }),
        );
      }
      if (data.nextQuestion) {
        dispatch(
          setCurrentQuestion({
            question: data.nextQuestion,
            index: currentQuestionIndex + 1,
          }),
        );
      } else {
        dispatch(completeSession(0));
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      }
    },
  });
}

// ── End interview ──────────────────────────────────────────────────────────

export function useEndInterview() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.endInterview(sessionId),
    onSuccess: (_data, sessionId) => {
      dispatch(abandonSession());
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

/** Post-interview study plan: weak topics, suggestions, reviews due. */
export function useStudyPlan(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'study-plan', sessionId],
    queryFn: () => interviewApi.getStudyPlan(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60, // due-review counts drift slowly; a minute is fine
  });
}

/** The user's interview-readiness score. */
export function useReadiness() {
  return useQuery({
    queryKey: ['interview', 'readiness'],
    queryFn: interviewApi.getReadiness,
    staleTime: 1000 * 60 * 2,
  });
}

/** Spoken-delivery analytics for a finished session (null when no prose). */
export function useDeliveryAnalytics(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'delivery', sessionId],
    queryFn: () => interviewApi.getDelivery(sessionId!),
    enabled: !!sessionId,
    staleTime: Infinity, // computed from immutable completed-session answers
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
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.pauseSession(sessionId),
    onSuccess: () => dispatch(setPaused(true)),
  });
}

export function useResumeSession() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.resumeSession(sessionId),
    onSuccess: () => dispatch(setPaused(false)),
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
