// src/hooks/useRecruiter.ts
//
// Which views a person gets, and the recruiter data behind them.
//
// The view list is computed from what the account actually has rather than
// read from a role column. That is the whole practical payoff of deriving
// roles: somebody who only recruits sees one view, somebody who does both sees
// two, and nobody configures anything. A stored role would need a BOTH value,
// and then a third when someone stops recruiting.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recruiterApi, type CreateTemplateInput } from '@/api/recruiter.api'
import { useAuthStore } from '@/store/authStore'

export type AppView = 'candidate' | 'recruiter'

export const recruiterKeys = {
  me: ['recruiter', 'me'] as const,
  templates: (includeArchived: boolean) => ['recruiter', 'templates', includeArchived] as const,
  invitations: (templateId?: string) => ['recruiter', 'invitations', templateId ?? 'all'] as const,
}

/** Remembered per device so somebody with both views lands where they left off. */
const LAST_VIEW_KEY = 'panelist_last_view'

export function useRecruiterProfile() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: recruiterKeys.me,
    queryFn: () => recruiterApi.getMe(),
    enabled: isAuthenticated,
    // Whether someone is a recruiter changes once, when they set up. Refetching
    // it on every window focus would be a request per tab switch for an answer
    // that almost never moves.
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * The views available to this person, and the one they should land on.
 *
 * ```
 * has a recruiter profile            → recruiter view
 * no profile, or has practised       → candidate view
 * ```
 *
 * The candidate view is the base product — anyone can practise — so it is
 * hidden only for someone who joined purely to recruit and has never used it.
 * An empty "readiness score: 0" dashboard is noise to them.
 */
export function useAvailableViews() {
  const { data, isLoading } = useRecruiterProfile()
  const isRecruiter = Boolean(data?.isRecruiter)

  const hasPractised = Boolean(data?.hasPractised)

  const views = useMemo<AppView[]>(() => {
    const list: AppView[] = []

    // Practice is the base product, so the candidate view is there for
    // everyone except somebody who signed up purely to hire and has never
    // used it — for them a dashboard reading "readiness score: 0" is noise
    // rather than an empty state.
    if (!isRecruiter || hasPractised) list.push('candidate')
    if (isRecruiter) list.push('recruiter')

    // Never nothing. A recruiter mid-setup, or an unexpected combination,
    // still has to land somewhere.
    return list.length > 0 ? list : ['candidate']
  }, [isRecruiter, hasPractised])

  // What they last chose. Only a preference — whether it is honoured depends
  // on what they still have.
  const [preferred, setPreferred] = useState<AppView>(() =>
    localStorage.getItem(LAST_VIEW_KEY) === 'recruiter' ? 'recruiter' : 'candidate',
  )

  // Derived during render rather than corrected afterwards in an effect.
  // Setting state to fix an impossible value causes a second render pass for
  // something already knowable in the first, and leaves one frame showing a
  // view the account does not have.
  const view: AppView = views.includes(preferred) ? preferred : views[0]

  // Persisting is a genuine side effect, so it does belong here — but it
  // writes to storage, not to state.
  useEffect(() => {
    if (!isLoading && view !== preferred) localStorage.setItem(LAST_VIEW_KEY, view)
  }, [view, preferred, isLoading])

  const setView = useCallback((next: AppView) => {
    setPreferred(next)
    localStorage.setItem(LAST_VIEW_KEY, next)
  }, [])

  return {
    views,
    view,
    setView,
    isRecruiter,
    /** A switcher with one option is not a switcher. */
    canSwitch: views.length > 1,
    dpaAccepted: Boolean(data?.dpaAccepted),
    profile: data?.profile ?? null,
    isLoading,
  }
}

export function useSetupRecruiter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { companyName: string; acceptDpa: boolean }) =>
      recruiterApi.setup(input),
    onSuccess: () => {
      // The recruiter view appears as a consequence of this row existing, so
      // the answer to "which views do I have" is now stale.
      queryClient.invalidateQueries({ queryKey: recruiterKeys.me })
      toast.success('Hiring profile saved.')
    },
    onError: (error: unknown) => toast.error(apiMessage(error, 'Could not save your profile.')),
  })
}

export function useTemplates(includeArchived = false) {
  const { isRecruiter } = useAvailableViews()

  return useQuery({
    queryKey: recruiterKeys.templates(includeArchived),
    queryFn: () => recruiterApi.listTemplates(includeArchived),
    enabled: isRecruiter,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTemplateInput) => recruiterApi.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'templates'] })
      toast.success('Interview created.')
    },
    onError: (error: unknown) => toast.error(apiMessage(error, 'Could not create the interview.')),
  })
}

export function useArchiveTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string) => recruiterApi.archiveTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'templates'] })
      toast.success('Interview archived.')
    },
    onError: (error: unknown) => toast.error(apiMessage(error, 'Could not archive it.')),
  })
}

export function useInvitations(templateId?: string) {
  const { isRecruiter } = useAvailableViews()

  return useQuery({
    queryKey: recruiterKeys.invitations(templateId),
    queryFn: () => recruiterApi.listInvitations(templateId),
    enabled: isRecruiter,
  })
}

export function useInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      templateId: string
      email: string
      expiresInDays?: number
      accommodationExtraMinutes?: number
    }) => recruiterApi.invite(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'invitations'] })
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'templates'] })
    },
    onError: (error: unknown) => toast.error(apiMessage(error, 'Could not send the invitation.')),
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => recruiterApi.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'invitations'] })
      toast.success('Invitation withdrawn.')
    },
    onError: (error: unknown) => toast.error(apiMessage(error, 'Could not withdraw it.')),
  })
}

/**
 * The server's message, when there is one.
 *
 * These carry the reason a request was refused — quota exhausted, DPA not
 * accepted, invitation already started — and each is more useful than any
 * generic string this file could invent.
 */
function apiMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? fallback
  )
}
