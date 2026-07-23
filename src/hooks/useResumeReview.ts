// src/hooks/useResumeReview.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resumeReviewApi } from '@/api/resume-review.api'
import type { CreateResumeReviewInput } from '@/types/resume-review'

export const resumeReviewKeys = {
  all: ['resume-review'] as const,
  list: () => [...resumeReviewKeys.all, 'list'] as const,
  detail: (id: string) => [...resumeReviewKeys.all, id] as const,
}

export function useResumeReviews() {
  return useQuery({
    queryKey: resumeReviewKeys.list(),
    queryFn: resumeReviewApi.list,
    staleTime: 1000 * 30,
  })
}

export function useResumeReview(id: string | null) {
  return useQuery({
    queryKey: resumeReviewKeys.detail(id ?? ''),
    queryFn: () => resumeReviewApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateResumeReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateResumeReviewInput) => resumeReviewApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resumeReviewKeys.list() })
    },
  })
}

export function useDeleteResumeReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resumeReviewApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resumeReviewKeys.list() })
    },
  })
}
