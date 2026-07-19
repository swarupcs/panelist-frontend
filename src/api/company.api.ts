// src/api/company.api.ts
import api from './axios';

/**
 * One question as a company asks it — the question itself plus how often this
 * company has been reported to ask it.
 *
 * Declared here rather than at the call site because this is where the shape
 * actually enters the app. Every response below unwraps `res.data.data`, which
 * is `any`, so anything read off one of these is unchecked until it is named.
 */
export interface CompanyQuestionRow {
  id: string;
  frequency: number;
  question?: {
    id: string;
    question: string;
    difficulty?: string;
  };
}

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
  ): Promise<{ questions: CompanyQuestionRow[] }> => {
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

  getReadiness: async (slug: string) => {
    const res = await api.get(`/companies/${slug}/readiness`);
    return res.data.data;
  },

  getAllReadiness: async () => {
    const res = await api.get('/companies/readiness');
    return res.data.data;
  },

  /**
   * Contribute an interview experience.
   *
   * `rounds` is stored as JSON on the backend; a list of round descriptions is
   * what the read side displays.
   */
  addExperience: async (
    slug: string,
    data: {
      position: string
      experienceLevel: string
      rounds: string[]
      outcome: string
      difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD'
      preparation: string
      tips?: string
      isAnonymous?: boolean
    },
  ): Promise<{ experience: unknown }> => {
    const res = await api.post(`/companies/${slug}/experience`, data)
    return res.data.data
  },
};
