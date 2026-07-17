// src/hooks/useProgress.ts
import { useQuery } from '@tanstack/react-query';
import { progressApi } from '@/api/user.api';
import { useAuthStore } from '@/store/authStore';

export function useUserProgress() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressApi.getProgress(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWeakAreas(limit = 5) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['progress', 'weak-areas', user?.id, limit],
    queryFn: () => progressApi.getWeakAreas(user!.id, limit),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
