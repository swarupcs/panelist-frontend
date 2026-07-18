// src/hooks/useSrs.ts

import { useQuery } from '@tanstack/react-query';
import { srsApi } from '@/api/srs.api';

export const srsKeys = {
  due: (limit: number) => ['srs', 'due', limit] as const,
};

/**
 * Topics due for review.
 *
 * The schedule only changes when an interview is answered, so this is stale
 * for long stretches and does not need refetching on every window focus.
 */
export function useDueReviews(limit = 10) {
  return useQuery({
    queryKey: srsKeys.due(limit),
    queryFn: () => srsApi.getDue(limit),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
