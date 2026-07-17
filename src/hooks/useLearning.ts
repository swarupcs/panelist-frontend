// src/hooks/useLearning.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningApi } from '@/api/user.api';

export function useLearningPath() {
  return useQuery({
    queryKey: ['learning', 'path'],
    queryFn: learningApi.getPath,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useGeneratePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningApi.generatePath,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning', 'path'] }),
  });
}

export function useCompleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => learningApi.completeTopic(topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning', 'path'] }),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['learning', 'recommendations'],
    queryFn: learningApi.getRecommendations,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGenerateRecommendations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningApi.generateRecommendations,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['learning', 'recommendations'] }),
  });
}

export function useCompleteRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learningApi.completeRecommendation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['learning', 'recommendations'] }),
  });
}

export function useDueReviews(limit = 10) {
  return useQuery({
    queryKey: ['learning', 'reviews', limit],
    queryFn: () => learningApi.getDueReviews(limit),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecordReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quality }: { itemId: string; quality: number }) =>
      learningApi.recordReview(itemId, quality),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning', 'reviews'] }),
  });
}
