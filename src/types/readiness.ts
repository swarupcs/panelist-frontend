// src/types/readiness.ts
export type ReadinessBand = 'Not ready yet' | 'Building' | 'Nearly there' | 'Interview ready'

export interface ReadinessComponent {
  key: string
  label: string
  value: number
  weight: number
}

export interface Readiness {
  hasData: boolean
  score: number
  band: ReadinessBand
  components: ReadinessComponent[]
  stats: {
    interviewsCompleted: number
    recentAvgScore: number
    currentStreak: number
    srsMastery: number
    weakAreas: number
  }
  tips: string[]
}
