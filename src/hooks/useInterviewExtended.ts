// src/hooks/useInterviewExtended.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { codeApi, historyApi, adaptiveApi } from '@/api/interview-extended.api';
import { interviewApi } from '@/api/interview.api';
import type { CodeExecutionRequest } from '@/types/interview-extended';

// ── Code Execution ─────────────────────────────────────────────────────────

export function useExecuteCode() {
  return useMutation({
    mutationFn: (data: CodeExecutionRequest) => codeApi.execute(data),
  });
}

// ── All Sessions (uses new GET /interview/sessions endpoint) ───────────────
// Returns ALL sessions for the user with pagination, not just replayed ones.

export function useRecentSessions(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['interview', 'sessions', params],
    queryFn: () => interviewApi.getSessions(params),
    select: (data) => data.sessions,
    staleTime: 1000 * 60 * 2,
  });
}

// ── Replay History (only sessions the user has replayed) ──────────────────

export function useReplayHistory() {
  return useQuery({
    queryKey: ['interview', 'replay-history'],
    queryFn: interviewApi.getReplayHistory,
    select: (data: any) => {
      if (Array.isArray(data)) return data;
      if (data?.history && Array.isArray(data.history)) return data.history;
      return [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ── Question Ratings ───────────────────────────────────────────────────────

export function useQuestionRatings(questionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'question-ratings', questionId],
    queryFn: () => historyApi.getQuestionRatings(questionId!),
    enabled: !!questionId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Replay progress ────────────────────────────────────────────────────────

export function useUpdateReplayProgress() {
  return useMutation({
    mutationFn: ({
      replayId,
      currentStep,
    }: {
      replayId: string;
      currentStep: number;
    }) => interviewApi.updateReplayProgress(replayId, currentStep),
  });
}

// ── Adaptive next question ─────────────────────────────────────────────────

export function useAdaptiveNextQuestion(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'adaptive', sessionId],
    queryFn: () => adaptiveApi.getNextQuestion(sessionId!),
    enabled: false,
    staleTime: 0,
  });
}
