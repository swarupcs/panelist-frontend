// src/hooks/useLearning.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningApi } from '@/api/user.api';
import type { LearningPath } from '@/types';

export function useLearningPath() {
  return useQuery<{ learningPath: LearningPath }>({
    queryKey: ['learning', 'path'],
    queryFn: () => learningApi.getPath(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useGeneratePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningApi.generatePath,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'path'] });
      qc.invalidateQueries({ queryKey: ['learning', 'allPaths'] });
    },
  });
}

export function useAdaptPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningApi.adaptPath,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'path'] });
      qc.invalidateQueries({ queryKey: ['learning', 'allPaths'] });
    },
  });
}

export function useAllPaths() {
  return useQuery<{ paths: LearningPath[] }>({
    queryKey: ['learning', 'allPaths'],
    queryFn: () => learningApi.getAllPaths(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSavePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, isSaved }: { pathId: string; isSaved: boolean }) =>
      learningApi.savePath(pathId, isSaved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'path'] });
      qc.invalidateQueries({ queryKey: ['learning', 'allPaths'] });
    },
  });
}

export function useSetActivePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pathId: string) => learningApi.setActivePath(pathId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'path'] });
      qc.invalidateQueries({ queryKey: ['learning', 'allPaths'] });
    },
  });
}

export function useDeletePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pathId: string) => learningApi.deletePath(pathId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'path'] });
      qc.invalidateQueries({ queryKey: ['learning', 'allPaths'] });
    },
  });
}

export function useCompleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => learningApi.completeTopic(topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning', 'path'] }),
  });
}

export function useCrashCourse(topicId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['learning', 'crashCourse', topicId],
    queryFn: () => learningApi.getCrashCourse(topicId),
    enabled: !!topicId && enabled,
    staleTime: Infinity,
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

export const useUpdateTargetDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pathId, targetDate }: { pathId: string; targetDate: string | null }) =>
      learningApi.updateTargetDate(pathId, targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'path'] });
    }
  });
};
