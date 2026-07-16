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

export function useDailyQuests() {
  return useQuery({
    queryKey: ['gamification', 'quests'],
    queryFn: gamificationApi.getDailyQuests,
    staleTime: 1000 * 60 * 2, // refresh every 2 minutes
  });
}

export function useClaimQuestXP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questType: string) => gamificationApi.claimQuestXP(questType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamification', 'quests'] });
      qc.invalidateQueries({ queryKey: ['gamification', 'stats'] });
      qc.invalidateQueries({ queryKey: ['gamification', 'achievements'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useGamificationStats() {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: gamificationApi.getStats,
    staleTime: 1000 * 60 * 2,
  });
}
