// src/types/resume-review.ts
// Types for the standalone Resume Review feature.

export type SuggestionPriority = 'high' | 'medium' | 'low'
export type SectionSeverity = 'critical' | 'warning' | 'good'

export interface ReviewSuggestion {
  priority: SuggestionPriority
  title: string
  detail: string
}

export interface SectionFeedback {
  section: string
  severity: SectionSeverity
  feedback: string
}

export interface RewriteExample {
  section: string
  original: string
  improved: string
  rationale: string
}

/** Full review as returned by GET/POST /resume-review. */
export interface ResumeReview {
  id: string
  userId: string
  fileUploadId?: string | null
  resumeText: string
  targetRole?: string | null
  jobDescription?: string | null
  experienceLevel?: string | null
  overallScore: number
  atsScore: number
  jdMatchScore?: number | null
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: ReviewSuggestion[]
  missingKeywords: string[]
  matchedKeywords: string[]
  sectionFeedback: SectionFeedback[]
  rewriteExamples: RewriteExample[]
  contentGaps: string[]
  formattingIssues: string[]
  model?: string | null
  createdAt: string
}

/** Compact row for the history list. */
export interface ResumeReviewListItem {
  id: string
  targetRole?: string | null
  experienceLevel?: string | null
  overallScore: number
  atsScore: number
  jdMatchScore?: number | null
  summary: string
  createdAt: string
}

export interface CreateResumeReviewInput {
  resumeText?: string
  fileUploadId?: string
  targetRole?: string
  jobDescription?: string
  experienceLevel?: string
}
