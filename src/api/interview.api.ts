// PATCH — add this method to the interviewApi object in src/api/interview.api.ts
// Insert after the `rateQuestion` method:

/*
  updateReplayProgress: async (replayId: string, currentStep: number) => {
    const res = await api.post(`/interview/replay/${replayId}/progress`, { currentStep })
    return res.data.data
  },
*/

// Full updated interviewApi export — replace your existing src/api/interview.api.ts with this:

import api from './axios';
import type {
  StartInterviewRequest,
  StartInterviewResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SkipQuestionResponse,
  HintResponse,
  TimerStatus,
  SessionResults,
  SessionListResponse,
} from '@/types';

export const interviewApi = {
  startInterview: async (
    data: StartInterviewRequest,
  ): Promise<StartInterviewResponse> => {
    const res = await api.post('/interview/start', data);
    return res.data.data;
  },

  submitAnswer: async (
    data: SubmitAnswerRequest,
  ): Promise<SubmitAnswerResponse> => {
    const res = await api.post('/interview/answer', data);
    return res.data.data;
  },

  getHint: async (sessionId: string): Promise<HintResponse> => {
    const res = await api.get(`/interview/${sessionId}/hint`);
    return res.data.data;
  },

  getSession: async (sessionId: string) => {
    const res = await api.get(`/interview/${sessionId}`);
    return res.data.data;
  },

  pauseSession: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/pause`);
    return res.data.data;
  },

  resumeSession: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/resume`);
    return res.data.data;
  },

  endInterview: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/end`);
    return res.data.data;
  },

  skipQuestion: async (sessionId: string): Promise<SkipQuestionResponse> => {
    const res = await api.post(`/interview/${sessionId}/skip`);
    return res.data.data;
  },

  getResults: async (sessionId: string): Promise<SessionResults> => {
    const res = await api.get(`/interview/${sessionId}/results`);
    return res.data.data;
  },

  getTimerStatus: async (sessionId: string): Promise<TimerStatus> => {
    const res = await api.get(`/interview/${sessionId}/timer`);
    return res.data.data;
  },

  pauseTimer: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/timer/pause`);
    return res.data.data;
  },

  resumeTimer: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/timer/resume`);
    return res.data.data;
  },

  getReplay: async (sessionId: string) => {
    const res = await api.get(`/interview/${sessionId}/replay`);
    return res.data.data;
  },

  getReplayHistory: async () => {
    const res = await api.get('/interview/replay/history');
    return res.data.data;
  },

  getSessions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<SessionListResponse> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    const res = await api.get(`/interview/sessions?${q}`);
    return res.data.data;
  },

  // ── NEW: update replay step progress ──────────────────────────────────
  updateReplayProgress: async (replayId: string, currentStep: number) => {
    const res = await api.post(`/interview/replay/${replayId}/progress`, {
      currentStep,
    });
    return res.data.data;
  },

  compareAttempts: async (sessionId1: string, sessionId2: string) => {
    const res = await api.get('/interview/compare', {
      params: { sessionId1, sessionId2 },
    });
    return res.data.data;
  },

  rateQuestion: async (
    questionId: string,
    rating: number,
    comment?: string,
  ) => {
    const res = await api.post(`/interview/questions/${questionId}/rate`, {
      rating,
      comment,
    });
    return res.data.data;
  },
};

export const queryApi = {
  processQuery: async (data: {
    query: string;
    userId: string;
    sessionId?: string;
    useRAG?: boolean;
  }) => {
    const res = await api.post('/query', data);
    return res.data.data;
  },

  getHistory: async (sessionId: string) => {
    const res = await api.get(`/query/history/${sessionId}`);
    return res.data.data;
  },
};
