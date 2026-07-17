// src/hooks/useGamification.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gamificationApi } from '@/api/user.api';

export function useAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: gamificationApi.getAchievements,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', limit],
    queryFn: () => gamificationApi.getLeaderboard(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateDailyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      minutesStudied,
      questionsAnswered,
    }: {
      minutesStudied: number;
      questionsAnswered: number;
    }) => gamificationApi.updateDailyGoal(minutesStudied, questionsAnswered),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['gamification', 'achievements'] }),
  });
}
