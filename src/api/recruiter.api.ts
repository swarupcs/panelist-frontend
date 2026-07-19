// src/api/recruiter.api.ts
//
// The recruiter side: becoming one, defining interviews, inviting candidates.
//
// There is no recruiter role. Somebody is a recruiter because a profile row
// exists, which is what `getMe` reports — the UI decides which views to offer
// from that rather than from anything on the account.

import api from './axios'

export interface RecruiterProfile {
  id: string
  companyName: string
  dpaAcceptedAt: string | null
  invitationQuota: number
  createdAt: string
}

export interface InterviewTemplate {
  id: string
  name: string
  type: string
  difficulty: string
  durationMinutes: number
  focusAreas: string[]
  language: string | null
  aiPersona: string
  stressMode: boolean
  requireRecording: boolean
  allowHints: boolean
  candidateSeesResult: boolean
  isArchived: boolean
  createdAt: string
  _count?: { invitations: number }
}

export type InvitationStatus =
  | 'PENDING'
  | 'OPENED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REVOKED'

export type IdentityConfidence =
  | 'UNBOUND'
  | 'EMAIL_MATCH'
  | 'EMAIL_MISMATCH'
  | 'VERIFIED'

export type HiringOutcome = 'UNDECIDED' | 'ADVANCED' | 'REJECTED' | 'WITHDRAWN'

export interface Invitation {
  id: string
  email: string
  status: InvitationStatus
  identityConfidence: IdentityConfidence
  expiresAt: string
  createdAt: string
  completedAt: string | null
  accommodationExtraMinutes: number
  maxAttempts: number
  outcome: HiringOutcome
  template: { id: string; name: string }
  attempts: Array<{
    id: string
    sessionId: string
    attemptNumber: number
    completedAt: string | null
  }>
}

export interface CreateTemplateInput {
  name: string
  type: string
  difficulty?: string
  durationMinutes?: number
  focusAreas?: string[]
  language?: string | null
  aiPersona?: string
  stressMode?: boolean
  requireRecording?: boolean
  allowHints?: boolean
  candidateSeesResult?: boolean
}

export const recruiterApi = {
  /**
   * Whether the signed-in user is a recruiter.
   *
   * Returns a normal 200 with `isRecruiter: false` for someone who is not —
   * that is an ordinary answer the UI uses to pick views, not an error.
   */
  getMe: async (): Promise<{
    profile: RecruiterProfile | null
    isRecruiter: boolean
    dpaAccepted: boolean
    /** Whether they have ever taken an interview themselves. Decides whether
     *  the candidate view is offered to a recruiter-only account. */
    hasPractised: boolean
  }> => {
    const res = await api.get('/recruiter/me')
    return res.data.data
  },

  /** Company name and DPA. Creating this is what makes the recruiter view appear. */
  setup: async (input: { companyName: string; acceptDpa: boolean }) => {
    const res = await api.post('/recruiter/setup', input)
    return res.data.data as { profile: RecruiterProfile }
  },

  listTemplates: async (includeArchived = false): Promise<InterviewTemplate[]> => {
    const res = await api.get(
      `/recruiter/templates${includeArchived ? '?includeArchived=true' : ''}`,
    )
    return res.data.data.templates
  },

  createTemplate: async (input: CreateTemplateInput): Promise<InterviewTemplate> => {
    const res = await api.post('/recruiter/templates', input)
    return res.data.data.template
  },

  /** Archives. Deleting would take the invitations that reference it with it. */
  archiveTemplate: async (templateId: string) => {
    const res = await api.delete(`/recruiter/templates/${templateId}`)
    return res.data.data
  },

  listInvitations: async (
    templateId?: string,
  ): Promise<{ invitations: Invitation[]; quota: { used: number; limit: number } }> => {
    const res = await api.get(
      `/recruiter/invitations${templateId ? `?templateId=${templateId}` : ''}`,
    )
    return res.data.data
  },

  /**
   * Invite a candidate.
   *
   * Returns the link as well as sending it. Email delivery is best-effort and
   * spam folders are real; a recruiter who cannot find the invitation has no
   * way to recover without this.
   */
  invite: async (input: {
    templateId: string
    email: string
    expiresInDays?: number
    accommodationExtraMinutes?: number
    maxAttempts?: number
  }) => {
    const res = await api.post('/recruiter/invitations', input)
    return res.data.data.invitation as {
      id: string
      email: string
      status: InvitationStatus
      expiresAt: string
      url: string
    }
  },

  /**
   * Record what a human decided.
   *
   * The assessment is input to that decision, never the decision itself — and
   * this is what starts the recording's retention clock.
   */
  recordOutcome: async (invitationId: string, outcome: HiringOutcome) => {
    const res = await api.patch(`/recruiter/invitations/${invitationId}/outcome`, { outcome })
    return res.data.data
  },

  /** Withdraws, frees the quota slot, and is the fix for a link bound to the wrong person. */
  revokeInvitation: async (invitationId: string) => {
    const res = await api.delete(`/recruiter/invitations/${invitationId}`)
    return res.data.data
  },
}

// ── Candidate side ──────────────────────────────────────────────────────────

export interface PublicInvitation {
  companyName: string
  /** Nobody has verified this name. The UI must not present it as confirmed. */
  companyNameVerified: boolean
  interviewName: string
  durationMinutes: number
  type: string
  expiresAt: string
  status: InvitationStatus
  expired: boolean
  revoked: boolean
  completed: boolean
  requiresRecording: boolean
  allowsHints: boolean
  resultShared: boolean
  alreadyBound: boolean
  /** Days a recording is kept after a decision. Zero means no automatic expiry. */
  retentionDays: number
}

export const invitationApi = {
  /** Public: this is what a candidate sees before being asked to sign in. */
  getPublic: async (token: string): Promise<PublicInvitation> => {
    const res = await api.get(`/invitations/${token}`)
    return res.data.data
  },

  /**
   * Open the interview.
   *
   * Binds the invitation to this account on the way through — which is why it
   * happens on start rather than when the page loads. Everything about the
   * session comes from the template, so there is nothing to pass.
   */
  start: async (token: string) => {
    const res = await api.post(`/invitations/${token}/start`)
    return res.data.data as {
      sessionId: string
      attemptNumber: number
      invitationId: string
      rules: {
        requireRecording: boolean
        allowHints: boolean
        candidateSeesResult: boolean
        durationMinutes: number
      }
    }
  },
}
