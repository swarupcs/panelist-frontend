import api from './axios'
import {
  StartInterviewRequest, StartInterviewResponse,
  SubmitAnswerRequest, SubmitAnswerResponse,
  HintResponse, TimerStatus,
} from '@/types'

export const interviewApi = {
  startInterview: async (data: StartInterviewRequest): Promise<StartInterviewResponse> => {
    const res = await api.post('/interview/start', data)
    return res.data.data
  },

  submitAnswer: async (data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
    const res = await api.post('/interview/answer', data)
    return res.data.data
  },

  getHint: async (sessionId: string): Promise<HintResponse> => {
    const res = await api.get(`/interview/${sessionId}/hint`)
    return res.data.data
  },

  getSession: async (sessionId: string) => {
    const res = await api.get(`/interview/${sessionId}`)
    return res.data.data
  },

  pauseSession: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/pause`)
    return res.data.data
  },

  resumeSession: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/resume`)
    return res.data.data
  },

  getTimerStatus: async (sessionId: string): Promise<TimerStatus> => {
    const res = await api.get(`/interview/${sessionId}/timer`)
    return res.data.data
  },

  getReplay: async (sessionId: string) => {
    const res = await api.get(`/interview/${sessionId}/replay`)
    return res.data.data
  },

  getReplayHistory: async () => {
    const res = await api.get('/interview/replay/history')
    return res.data.data
  },

  rateQuestion: async (questionId: string, rating: number, comment?: string) => {
    const res = await api.post(`/interview/questions/${questionId}/rate`, { rating, comment })
    return res.data.data
  },
}

export const queryApi = {
  processQuery: async (data: {
    query: string
    userId: string
    sessionId?: string
    useRAG?: boolean
  }) => {
    const res = await api.post('/query', data)
    return res.data.data
  },

  getHistory: async (sessionId: string) => {
    const res = await api.get(`/query/history/${sessionId}`)
    return res.data.data
  },
}
