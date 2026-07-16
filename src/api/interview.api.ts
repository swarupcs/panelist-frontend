// src/api/interview.api.ts
//
// FIXES
// ─────────────────────────────────────────────────────────────────────────────
// API-1  startInterview no longer sends userId in the body.
//        Backend (AUTH-1 fix) derives userId from the JWT token.
//
// API-2  submitAnswer no longer sends userId in the body.
//        Backend (AUTH-2 fix) derives userId from the JWT token.
//
// API-3  Added endInterview   → POST /interview/:sessionId/end
// API-4  Added skipQuestion   → POST /interview/:sessionId/skip
// API-5  Added getResults     → GET  /interview/:sessionId/results
// API-6  Added compareAttempts → GET  /interview/compare?sessionId1=&sessionId2=

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
} from '@/types';

export const interviewApi = {
  // API-1 FIX: userId removed — derived from JWT on the backend
  startInterview: async (
    data: StartInterviewRequest,
  ): Promise<StartInterviewResponse> => {
    const res = await api.post('/interview/start', data);
    return res.data.data;
  },

  // API-2 FIX: userId removed — derived from JWT on the backend
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

  // API-3: explicit end (abandoned) — POST /:sessionId/end
  endInterview: async (sessionId: string) => {
    const res = await api.post(`/interview/${sessionId}/end`);
    return res.data.data;
  },

  // API-4: skip current question — POST /:sessionId/skip
  skipQuestion: async (sessionId: string): Promise<SkipQuestionResponse> => {
    const res = await api.post(`/interview/${sessionId}/skip`);
    return res.data.data;
  },

  // API-5: full results breakdown — GET /:sessionId/results
  getResults: async (sessionId: string): Promise<SessionResults> => {
    const res = await api.get(`/interview/${sessionId}/results`);
    return res.data.data;
  },

  getTimerStatus: async (sessionId: string): Promise<TimerStatus> => {
    const res = await api.get(`/interview/${sessionId}/timer`);
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

  // API-6: compare two attempts — GET /interview/compare?sessionId1=&sessionId2=
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
