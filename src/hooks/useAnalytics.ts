import { useMutation, useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics.api'
import { learningApi, progressApi, userApi, gamificationApi } from '@/api/user.api'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'

// ── Analytics Hooks ────────────────────────────────────────────────────────

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsApi.getDashboard,
    staleTime: 1000 * 60 * 2,
  })
}

export function useInterviewStats() {
  return useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: analyticsApi.getStats,
  })
}

export function useTopicPerformance() {
  return useQuery({
    queryKey: ['analytics', 'topics'],
    queryFn: analyticsApi.getTopicPerformance,
    select: (data) => data.topics,
  })
}

export function usePerformanceTrends(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'trends', days],
    queryFn: () => analyticsApi.getPerformanceTrends(days),
    select: (data) => data.trends,
  })
}

export function useComparativeAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'comparative'],
    queryFn: analyticsApi.getComparative,
  })
}

export function useSkillGaps() {
  return useQuery({
    queryKey: ['analytics', 'skill-gaps'],
    queryFn: analyticsApi.getSkillGaps,
  })
}

// ── Progress Hooks ─────────────────────────────────────────────────────────

export function useUserProgress() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressApi.getProgress(user!.id),
    enabled: !!user?.id,
  })
}

export function useWeakAreas(limit = 5) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['progress', user?.id, 'weak-areas', limit],
    queryFn: () => progressApi.getWeakAreas(user!.id, limit),
    enabled: !!user?.id,
    select: (data) => data.weakAreas,
  })
}

// ── Learning Path Hooks ────────────────────────────────────────────────────

export function useLearningPath() {
  return useQuery({
    queryKey: ['learning', 'path'],
    queryFn: learningApi.getPath,
    select: (data) => data.learningPath,
  })
}

export function useGenerateLearningPath() {
  return useMutation({
    mutationFn: learningApi.generatePath,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'path'] })
    },
  })
}

export function useCompleteTopic() {
  return useMutation({
    mutationFn: (topicId: string) => learningApi.completeTopic(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] })
    },
  })
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['learning', 'recommendations'],
    queryFn: learningApi.getRecommendations,
    select: (data) => data.recommendations,
  })
}

export function useCompleteRecommendation() {
  return useMutation({
    mutationFn: (id: string) => learningApi.completeRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'recommendations'] })
    },
  })
}

export function useDueReviews(limit = 10) {
  return useQuery({
    queryKey: ['learning', 'reviews', limit],
    queryFn: () => learningApi.getDueReviews(limit),
  })
}

export function useRecordReview() {
  return useMutation({
    mutationFn: ({ itemId, quality }: { itemId: string; quality: number }) =>
      learningApi.recordReview(itemId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'reviews'] })
    },
  })
}

// ── User / Profile Hooks ───────────────────────────────────────────────────

export function useUserPreferences() {
  return useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: userApi.getPreferences,
    select: (data) => data.preferences,
  })
}

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: userApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] })
    },
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: userApi.changePassword,
  })
}

export function useLoginHistory(limit = 10) {
  return useQuery({
    queryKey: ['user', 'login-history', limit],
    queryFn: () => userApi.getLoginHistory(limit),
    select: (data) => data.loginHistory,
  })
}

// ── Gamification Hooks ─────────────────────────────────────────────────────

export function useAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: gamificationApi.getAchievements,
    select: (data) => data.achievements,
  })
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', limit],
    queryFn: () => gamificationApi.getLeaderboard(limit),
    select: (data) => data.leaderboard,
  })
}
