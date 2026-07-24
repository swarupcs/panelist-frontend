// src/api/interview-loop.api.ts
import api from './axios'
import type {
  InterviewLoop,
  InterviewLoopListItem,
  CreateLoopInput,
  StartRoundResult,
} from '@/types/interview-loop'

export const interviewLoopApi = {
  create: async (input: CreateLoopInput): Promise<InterviewLoop> => {
    const res = await api.post('/interview-loops', input)
    return res.data.data.loop
  },

  list: async (): Promise<InterviewLoopListItem[]> => {
    const res = await api.get('/interview-loops')
    return res.data.data.loops
  },

  get: async (loopId: string): Promise<InterviewLoop> => {
    const res = await api.get(`/interview-loops/${loopId}`)
    return res.data.data.loop
  },

  startRound: async (loopId: string): Promise<StartRoundResult> => {
    const res = await api.post(`/interview-loops/${loopId}/start-round`)
    return res.data.data
  },

  abandon: async (loopId: string): Promise<void> => {
    await api.post(`/interview-loops/${loopId}/abandon`)
  },
}
