// src/hooks/useSessionContext.ts
//
// The rules a running interview is subject to.
//
// Fetched rather than carried. The start response already returns these, but
// navigating to the session loses them, a refresh loses them, and — the part
// that matters — anything the browser holds is something the candidate can
// change. Rules deciding whether hints are available or a score is shown
// cannot be enforced by asking the client nicely.
//
// Null for practice, which is most sessions: the candidate owns those, and
// nothing is imposed on them.

import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'

export interface SessionContext {
  isAssessment: true
  companyName: string
  interviewName: string
  attemptNumber: number
  requireRecording: boolean
  allowHints: boolean
  candidateSeesResult: boolean
  /** Days the recording is kept after a decision. Zero means indefinitely. */
  retentionDays: number
}

export function useSessionContext(sessionId: string | undefined) {
  const query = useQuery({
    queryKey: ['session-context', sessionId],
    queryFn: async (): Promise<SessionContext | null> => {
      const res = await api.get(`/interview/${sessionId}/context`)
      return res.data.data.context
    },
    enabled: Boolean(sessionId),
    // The rules cannot change mid-interview, so asking once is enough.
    staleTime: Infinity,
  })

  const context = query.data ?? null

  return {
    context,
    isAssessment: Boolean(context),
    // Practice keeps every affordance. An assessment gets only what its
    // template allows — and while the answer is still loading, the safer
    // assumption is the restrictive one: showing a hint button that then
    // vanishes is worse than showing it a moment late.
    allowHints: context ? context.allowHints : !query.isLoading,
    requireRecording: context?.requireRecording ?? false,
    candidateSeesResult: context ? context.candidateSeesResult : true,
    isLoading: query.isLoading,
  }
}
