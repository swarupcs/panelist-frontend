// src/hooks/useInterview.ts
//
// FIXES
// ─────────────────────────────────────────────────────────────────────────────
// HOOK-1  useStartInterview no longer injects userId into the request body.
//         Backend (AUTH-1 fix) derives userId from the JWT token.
//
// HOOK-2  useSubmitAnswer no longer injects userId.
//         Backend (AUTH-2 fix) derives userId from the JWT token.
//
// HOOK-3  useSubmitAnswer.onSuccess previously called completeSession(data.score)
//         where data.score is a per-question score, not the final session score.
//         The final score is only available from GET /:sessionId/results after
//         the session is marked COMPLETED. completeSession() is now called with
//         0 as a placeholder; the results page fetches the real score.
//
// HOOK-4  usePauseSession / useResumeSession never updated the Zustand store,
//         so isPaused never flipped and the pause button was permanently broken.
//         Fixed: onSuccess calls store.setPaused().
//
// HOOK-5  Added useEndInterview   — calls POST /:sessionId/end, then abandons
//         the store session and navigates away.
//
// HOOK-6  Added useSkipQuestion   — calls POST /:sessionId/skip, advances the
//         store question exactly like a normal answer submission.
//
// HOOK-7  Added useSessionResults — GET /:sessionId/results (used on the
//         results page).
//
// HOOK-8  Added useCompareAttempts — GET /interview/compare?sessionId1=&sessionId2=

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

// ── Start ─────────────────────────────────────────────────────────────────────

export function useStartInterview() {
  const { startSession } = useInterviewStore();
  const navigate = useNavigate();

  return useMutation({
    // HOOK-1 FIX: no userId — backend reads it from the token
    mutationFn: (data: StartInterviewRequest) =>
      interviewApi.startInterview(data),
    onSuccess: (data) => {
      startSession({
        sessionId: data.sessionId,
        type: data.type as InterviewType,
        difficulty: 'medium' as Difficulty, // default; overridden by question data
        currentQuestion: data.currentQuestion,
        totalQuestions: data.totalQuestions,
      });
      navigate(`/interview/${data.sessionId}`);
    },
  });
}

// ── Submit answer ─────────────────────────────────────────────────────────────

export function useSubmitAnswer() {
  const {
    recordAnswer,
    setCurrentQuestion,
    completeSession,
    currentQuestionIndex,
  } = useInterviewStore();

  return useMutation({
    // HOOK-2 FIX: no userId — backend reads it from the token
    mutationFn: (data: SubmitAnswerRequest) => interviewApi.submitAnswer(data),
    onSuccess: (data, variables) => {
      // Always record the answer in the store
      recordAnswer(
        variables.sessionId,
        variables.answer,
        data.score,
        data.feedback,
      );

      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion, currentQuestionIndex + 1);
      } else {
        // HOOK-3 FIX: pass 0 as placeholder — real score fetched from /results
        completeSession(0);
        // Invalidate so analytics & progress refresh once the user views results
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      }
    },
  });
}

// ── Skip question ─────────────────────────────────────────────────────────────

// HOOK-6
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
      // Record the skip so the results page can mark it as skipped
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

// ── End interview early ───────────────────────────────────────────────────────

// HOOK-5
export function useEndInterview() {
  const { abandonSession } = useInterviewStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.endInterview(sessionId),
    onSuccess: (_data, sessionId) => {
      abandonSession();
      navigate(`/interview/results/${sessionId}`);
    },
  });
}

// ── Hint ──────────────────────────────────────────────────────────────────────

export function useRequestHint(sessionId: string) {
  return useMutation({
    mutationFn: () => interviewApi.getHint(sessionId),
  });
}

// ── Session status ────────────────────────────────────────────────────────────

export function useSessionStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'session', sessionId],
    queryFn: () => interviewApi.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });
}

// ── Results ───────────────────────────────────────────────────────────────────

// HOOK-7
export function useSessionResults(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'results', sessionId],
    queryFn: () => interviewApi.getResults(sessionId!),
    enabled: !!sessionId,
    // Don't refetch — results are immutable once the session is COMPLETED
    staleTime: Infinity,
  });
}

// ── Timer ─────────────────────────────────────────────────────────────────────

export function useTimerStatus(sessionId: string | null, enabled = false) {
  return useQuery({
    queryKey: ['interview', 'timer', sessionId],
    queryFn: () => interviewApi.getTimerStatus(sessionId!),
    enabled: !!sessionId && enabled,
    refetchInterval: 5000,
  });
}

// ── Pause / resume ────────────────────────────────────────────────────────────

export function usePauseSession() {
  // HOOK-4 FIX: update the store so isPaused flips and the UI re-renders
  const { setPaused } = useInterviewStore();

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.pauseSession(sessionId),
    onSuccess: () => setPaused(true),
  });
}

export function useResumeSession() {
  // HOOK-4 FIX: same — flip isPaused back to false
  const { setPaused } = useInterviewStore();

  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.resumeSession(sessionId),
    onSuccess: () => setPaused(false),
  });
}

// ── Replay ────────────────────────────────────────────────────────────────────

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

// ── Compare attempts ──────────────────────────────────────────────────────────

// HOOK-8
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

// ── Question rating ───────────────────────────────────────────────────────────

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

    // Don't let React Query treat 422 as a thrown/unhandled error.
    // The component's onError callback handles it by hiding the widget.
    throwOnError: false,
  });
}
