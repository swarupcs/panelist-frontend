// src/api/resume-review.api.ts
import api from './axios'
import type {
  ResumeReview,
  ResumeReviewListItem,
  CreateResumeReviewInput,
} from '@/types/resume-review'

export const resumeReviewApi = {
  create: async (input: CreateResumeReviewInput): Promise<ResumeReview> => {
    const res = await api.post('/resume-review', input)
    return res.data.data.review
  },

  list: async (): Promise<ResumeReviewListItem[]> => {
    const res = await api.get('/resume-review')
    return res.data.data.reviews
  },

  get: async (id: string): Promise<ResumeReview> => {
    const res = await api.get(`/resume-review/${id}`)
    return res.data.data.review
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/resume-review/${id}`)
  },
}
