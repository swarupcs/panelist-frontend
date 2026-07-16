import type { AnalyticsDashboard, ComparativeAnalytics, InterviewStats, PerformanceTrend, SkillGap, TopicPerformance } from '../types'
import api from './axios'


export const analyticsApi = {
  getDashboard: async (): Promise<AnalyticsDashboard> => {
    const res = await api.get('/analytics/dashboard')
    return res.data.data
  },

  getStats: async (): Promise<InterviewStats> => {
    const res = await api.get('/analytics/stats')
    return res.data.data
  },

  getTopicPerformance: async (): Promise<{ topics: TopicPerformance[] }> => {
    const res = await api.get('/analytics/performance/topics')
    return res.data.data
  },

  getPerformanceTrends: async (days = 30): Promise<{ trends: PerformanceTrend[] }> => {
    const res = await api.get(`/analytics/performance/trends?days=${days}`)
    return res.data.data
  },

  getComparative: async (): Promise<ComparativeAnalytics> => {
    const res = await api.get('/analytics/comparative')
    return res.data.data
  },

  getSkillGaps: async (): Promise<{ skillGaps: SkillGap[]; weakAreas: any[]; currentLevel: string; goalLevel: string }> => {
    const res = await api.get('/analytics/skill-gaps')
    return res.data.data
  },
}
