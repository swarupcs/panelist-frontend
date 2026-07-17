// src/hooks/useInterviewExtended.ts
//
// Hooks for features that existed in the backend but had no frontend wiring.
// Complements useInterview.ts — never duplicates existing exports.

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

// ── Recent Sessions (via replay history) ──────────────────────────────────

export function useRecentSessions() {
  return useQuery({
    queryKey: ['interview', 'recent-sessions'],
    queryFn: historyApi.getRecentSessions,
    staleTime: 1000 * 60 * 2, // 2 min
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
    enabled: false, // triggered manually via refetch()
    staleTime: 0,
  });
}
