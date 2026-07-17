// src/api/interview-extended.api.ts
// Adds API calls for features that existed in the backend but had no frontend wiring:
//   - Code execution  (POST /api/code/execute)
//   - Interview history (GET /api/interview — uses session status query)
//   - Question ratings  (GET /interview/questions/:id/ratings)
//   - Adaptive next question (GET /api/adaptive-interview/:sessionId/next)

import api from './axios';
import type {
  CodeExecutionRequest,
  CodeExecutionResult,
  InterviewHistoryResponse,
  QuestionRatings,
  ReplayData,
  ReplayHistoryItem,
  CompareResult,
} from '@/types/interview-extended';

// ── Code Execution ─────────────────────────────────────────────────────────

export const codeApi = {
  execute: async (data: CodeExecutionRequest): Promise<CodeExecutionResult> => {
    const res = await api.post('/code/execute', data);
    return res.data.data;
  },
};

// ── Interview History ──────────────────────────────────────────────────────
// Backend doesn't have a dedicated "list sessions" route on /api/interview,
// but the analytics dashboard returns stats and the progress endpoint gives
// weak areas. For history we use the analytics stats + we store a local
// list of sessionIds the user started in this browser session.
// The most reliable source is GET /api/analytics/stats which is already used
// on the dashboard. For a dedicated history list we call the replay history
// which returns recent sessions with their scores.

export const historyApi = {
  // Uses replay history as the source of recent completed sessions
  getRecentSessions: async (): Promise<ReplayHistoryItem[]> => {
    const res = await api.get('/interview/replay/history');
    return res.data.data;
  },

  // Get ratings for a question
  getQuestionRatings: async (questionId: string): Promise<QuestionRatings> => {
    const res = await api.get(`/interview/questions/${questionId}/ratings`);
    return res.data.data;
  },
};

// ── Adaptive Interview ─────────────────────────────────────────────────────

export const adaptiveApi = {
  getNextQuestion: async (sessionId: string) => {
    const res = await api.get(`/adaptive-interview/${sessionId}/next`);
    return res.data.data;
  },
};
