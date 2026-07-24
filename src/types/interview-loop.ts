// src/types/interview-loop.ts
// Company-loop simulation: a multi-round interview journey.

export type LoopStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | 'IN_PROGRESS'
export type LoopRoundStatus = 'NOT_STARTED' | LoopStatus

export type LoopRecommendation = 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire'

export interface LoopRound {
  index: number
  type: string
  difficulty: string
  label: string
  durationMinutes: number
  sessionId: string | null
  status: LoopRoundStatus
  score: number | null
}

export interface LoopVerdict {
  recommendation: LoopRecommendation
  avgScore: number
  summary: string
  roundScores: Array<{
    index: number
    label: string
    type: string
    score: number | null
    sessionId: string | null
  }>
}

export interface InterviewLoop {
  id: string
  title: string
  companyTarget: string | null
  status: LoopStatus
  overallScore: number | null
  verdict: LoopVerdict | null
  createdAt: string
  completedAt: string | null
  rounds: LoopRound[]
  progress: {
    completed: number
    total: number
    nextRoundIndex: number | null
  }
}

export interface InterviewLoopListItem {
  id: string
  title: string
  companyTarget: string | null
  status: LoopStatus
  overallScore: number | null
  totalRounds: number
  createdAt: string
  completedAt: string | null
}

export interface RoundConfig {
  type: string
  difficulty: string
  label?: string
  durationMinutes?: number
}

export interface CreateLoopInput {
  title?: string
  companyTarget?: string
  rounds?: RoundConfig[]
}

export interface StartRoundResult {
  sessionId: string
  roundIndex: number
  resumed: boolean
}
