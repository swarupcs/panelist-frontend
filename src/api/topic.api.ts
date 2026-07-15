// src/api/topic.api.ts
import api from './axios';

export const topicApi = {
  getAll: async (filters?: { category?: string; difficulty?: string }) => {
    const q = new URLSearchParams();
    if (filters?.category) q.set('category', filters.category);
    if (filters?.difficulty) q.set('difficulty', filters.difficulty);
    const res = await api.get(`/topics?${q}`);
    return res.data.data;
  },

  getTree: async (category?: string) => {
    const q = category ? `?category=${category}` : '';
    const res = await api.get(`/topics/tree${q}`);
    return res.data.data;
  },

  getBySlug: async (slug: string) => {
    const res = await api.get(`/topics/${slug}`);
    return res.data.data;
  },

  getQuestions: async (
    slug: string,
    filters?: { difficulty?: string; limit?: number },
  ) => {
    const q = new URLSearchParams();
    if (filters?.difficulty) q.set('difficulty', filters.difficulty);
    if (filters?.limit) q.set('limit', String(filters.limit));
    const res = await api.get(`/topics/${slug}/questions?${q}`);
    return res.data.data;
  },

  getStatistics: async (slug: string) => {
    const res = await api.get(`/topics/${slug}/statistics`);
    return res.data.data;
  },

  getUserProgress: async (slug: string) => {
    const res = await api.get(`/topics/${slug}/progress`);
    return res.data.data;
  },

  getMasteryOverview: async () => {
    const res = await api.get('/topics/mastery');
    return res.data.data;
  },

  getRecommended: async () => {
    const res = await api.get('/topics/recommended');
    return res.data.data;
  },

  startPractice: async (
    slug: string,
    config: { questionCount: number; difficulty?: string; duration?: number },
  ) => {
    const res = await api.post(`/topics/${slug}/practice`, config);
    return res.data.data;
  },
};
