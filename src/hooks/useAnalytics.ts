// src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsApi.getDashboard,
    staleTime: 1000 * 60 * 5,
  });
}

export function useInterviewStats() {
  return useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: analyticsApi.getStats,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopicPerformance() {
  return useQuery({
    queryKey: ['analytics', 'topics'],
    queryFn: analyticsApi.getTopicPerformance,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePerformanceTrends(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'trends', days],
    queryFn: () =>
      analyticsApi.getPerformanceTrends(days).then((r) => r.trends),
    staleTime: 1000 * 60 * 5,
  });
}

export function useComparativeAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'comparative'],
    queryFn: analyticsApi.getComparative,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSkillGaps() {
  return useQuery({
    queryKey: ['analytics', 'skill-gaps'],
    queryFn: analyticsApi.getSkillGaps,
    staleTime: 1000 * 60 * 10,
  });
}
