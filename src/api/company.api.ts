// src/api/company.api.ts
import api from './axios';

export const companyApi = {
  getAll: async (filters?: { industry?: string; difficulty?: string }) => {
    const q = new URLSearchParams();
    if (filters?.industry) q.set('industry', filters.industry);
    if (filters?.difficulty) q.set('difficulty', filters.difficulty);
    const res = await api.get(`/companies?${q}`);
    return res.data.data;
  },

  getBySlug: async (slug: string) => {
    const res = await api.get(`/companies/${slug}`);
    return res.data.data;
  },

  getQuestions: async (
    slug: string,
    filters?: { difficulty?: string; limit?: number },
  ) => {
    const q = new URLSearchParams();
    if (filters?.difficulty) q.set('difficulty', filters.difficulty);
    if (filters?.limit) q.set('limit', String(filters.limit));
    const res = await api.get(`/companies/${slug}/questions?${q}`);
    return res.data.data;
  },

  getStatistics: async (slug: string) => {
    const res = await api.get(`/companies/${slug}/statistics`);
    return res.data.data;
  },

  getUserProgress: async (slug: string) => {
    const res = await api.get(`/companies/${slug}/progress`);
    return res.data.data;
  },

  startPractice: async (
    slug: string,
    config: { questionCount: number; difficulty?: string; duration?: number },
  ) => {
    const res = await api.post(`/companies/${slug}/practice`, config);
    return res.data.data;
  },

  getRecommended: async () => {
    const res = await api.get('/companies/recommended');
    return res.data.data;
  },
};
