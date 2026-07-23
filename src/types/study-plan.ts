// src/types/study-plan.ts
// The post-interview study plan that closes the learning loop.
import type { InterviewType, Difficulty } from '@/types'

export interface CategoryPerformance {
  category: string
  attempted: number
  missed: number
  avgScore: number | null
}

export interface StudyPlan {
  sessionId: string
  sessionType: string
  weakCategories: CategoryPerformance[]
  focusAreas: string[]
  suggestions: string[]
  weaknesses: string[]
  spacedRepetition: {
    dueForReview: number
    enrolledWeakCategories: number
  }
  recommendedPractice: {
    type: InterviewType
    difficulty: Difficulty
    focusAreas: string[]
  } | null
  hasReport: boolean
}
