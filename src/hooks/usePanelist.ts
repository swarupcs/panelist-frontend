// src/hooks/usePanelist.ts
//
// Hooks for the session-aware interview endpoints.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { panelistApi, recruiterApi } from '@/api/panelist.api';
import type {
  AnswerFollowUpRequest,
  SubmitCodeRequest,
  SubmitDrawingRequest,
} from '@/types/panelist';

export const panelistKeys = {
  transcript: (sessionId: string) => ['panelist', 'transcript', sessionId] as const,
  report: (sessionId: string) => ['panelist', 'report', sessionId] as const,
  dossier: (sessionId: string) => ['recruiter', 'dossier', sessionId] as const,
};

/**
 * Submit code for grading and evaluation.
 *
 * Invalidates the transcript on success, since a submission appends several
 * events to it.
 */
export function useSubmitCode(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitCodeRequest) => panelistApi.submitCode(sessionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: panelistKeys.transcript(sessionId) });
    },
  });
}

/** Answer or skip the follow-up; the session advances server-side. */
export function useAnswerFollowUp(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AnswerFollowUpRequest) =>
      panelistApi.answerFollowUp(sessionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: panelistKeys.transcript(sessionId) });
    },
  });
}

export function useSubmitDrawing(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitDrawingRequest) => panelistApi.submitDrawing(sessionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: panelistKeys.transcript(sessionId) });
    },
  });
}

export function useTranscript(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: panelistKeys.transcript(sessionId),
    queryFn: () => panelistApi.getTranscript(sessionId),
    enabled: enabled && !!sessionId,
  });
}

/**
 * The end-of-session report.
 *
 * The backend starts generating this when the session completes, but a request
 * that arrives first will generate on demand and can take a while — hence the
 * long staleTime and no refetch on focus. Retry is disabled because the common
 * failure is "session has no events yet", which retrying will not fix.
 */
export function useReport(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: panelistKeys.report(sessionId),
    queryFn: () => panelistApi.getReport(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useRegenerateReport(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => panelistApi.regenerateReport(sessionId),
    onSuccess: (report) => {
      qc.setQueryData(panelistKeys.report(sessionId), report);
    },
  });
}

export function useRecruiterDossier(sessionId: string) {
  return useQuery({
    queryKey: panelistKeys.dossier(sessionId),
    queryFn: () => recruiterApi.getDossier(sessionId),
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
