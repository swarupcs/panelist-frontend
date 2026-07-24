// src/hooks/useInterviewLoop.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { interviewLoopApi } from '@/api/interview-loop.api'
import type { CreateLoopInput } from '@/types/interview-loop'

export const loopKeys = {
  all: ['interview-loops'] as const,
  list: () => [...loopKeys.all, 'list'] as const,
  detail: (id: string) => [...loopKeys.all, id] as const,
}

export function useInterviewLoops() {
  return useQuery({
    queryKey: loopKeys.list(),
    queryFn: interviewLoopApi.list,
    staleTime: 1000 * 30,
  })
}

export function useInterviewLoop(loopId: string | null) {
  return useQuery({
    queryKey: loopKeys.detail(loopId ?? ''),
    queryFn: () => interviewLoopApi.get(loopId!),
    enabled: !!loopId,
    staleTime: 1000 * 15,
  })
}

export function useCreateLoop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLoopInput) => interviewLoopApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: loopKeys.list() }),
  })
}

export function useStartLoopRound() {
  return useMutation({
    mutationFn: (loopId: string) => interviewLoopApi.startRound(loopId),
  })
}

export function useAbandonLoop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (loopId: string) => interviewLoopApi.abandon(loopId),
    onSuccess: () => qc.invalidateQueries({ queryKey: loopKeys.all }),
  })
}
