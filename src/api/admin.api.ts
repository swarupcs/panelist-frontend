// src/api/admin.api.ts  (FULL REPLACEMENT)
import api from './axios'
import type {
  AdminDashboardStats,
  AdminUserListItem,
  AdminUserDetails,
  AdminAction,
  AdminAnalyticsOverview,
  AdminUserBehavior,
  AdminCohortData,
  AdminApiUsage,
  AdminErrorLogs,
  AdminSystemHealth,
  AdminPerformanceMetrics,
  AdminReport,
  AdminBulkBanResult,
  AdminAIQuestionStats,
  AdminAIQuestion,
  Pagination,
} from '@/types/admin'

// ── Dashboard ──────────────────────────────────────────────────────────────

export const adminStatsApi = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const res = await api.get('/admin/users/stats')
    return res.data.data
  },
}

// ── User Management ────────────────────────────────────────────────────────

export const adminUserApi = {
  getUsers: async (params: {
    search?: string
    role?: string
    status?: string
    emailVerified?: boolean
    dateFrom?: string
    dateTo?: string
    isSuspicious?: boolean
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ users: AdminUserListItem[]; pagination: Pagination }> => {
    const q = new URLSearchParams()
    if (params.search)                      q.set('search',        params.search)
    if (params.role)                        q.set('role',          params.role)
    if (params.status)                      q.set('status',        params.status)
    if (params.emailVerified !== undefined)  q.set('emailVerified', String(params.emailVerified))
    if (params.dateFrom)                    q.set('dateFrom',      params.dateFrom)
    if (params.dateTo)                      q.set('dateTo',        params.dateTo)
    if (params.isSuspicious !== undefined)   q.set('isSuspicious',  String(params.isSuspicious))
    if (params.page)                        q.set('page',          String(params.page))
    if (params.limit)                       q.set('limit',         String(params.limit))
    if (params.sortBy)                      q.set('sortBy',        params.sortBy)
    if (params.sortOrder)                   q.set('sortOrder',     params.sortOrder)
    const res = await api.get(`/admin/users?${q}`)
    return res.data.data
  },

  getUserDetails: async (userId: string): Promise<AdminUserDetails> => {
    const res = await api.get(`/admin/users/${userId}`)
    return res.data.data
  },

  banUser: async (userId: string, reason: string, isPermanent = true) => {
    const res = await api.post(`/admin/users/${userId}/ban`, { reason, isPermanent })
    return res.data.data
  },

  unbanUser: async (userId: string) => {
    const res = await api.post(`/admin/users/${userId}/unban`)
    return res.data.data
  },

  suspendUser: async (userId: string, reason: string, durationHours: number) => {
    const res = await api.post(`/admin/users/${userId}/suspend`, { reason, durationHours })
    return res.data.data
  },

  unsuspendUser: async (userId: string) => {
    const res = await api.post(`/admin/users/${userId}/unsuspend`)
    return res.data.data
  },

  changeRole: async (userId: string, role: string) => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role })
    return res.data.data
  },

  resetPassword: async (userId: string, newPassword: string) => {
    const res = await api.post(`/admin/users/${userId}/reset-password`, { newPassword })
    return res.data.data
  },

  deleteUser: async (userId: string, reason: string) => {
    const res = await api.delete(`/admin/users/${userId}`, { data: { reason } })
    return res.data.data
  },

  updateNotes: async (userId: string, notes: string) => {
    const res = await api.patch(`/admin/users/${userId}/notes`, { notes })
    return res.data.data
  },

  markSuspicious: async (userId: string, isSuspicious: boolean) => {
    const res = await api.patch(`/admin/users/${userId}/suspicious`, { isSuspicious })
    return res.data.data
  },

  getUserActivity: async (userId: string, limit = 50) => {
    const res = await api.get(`/admin/users/${userId}/activity?limit=${limit}`)
    return res.data.data
  },

  exportUserData: async (userId: string) => {
    const res = await api.get(`/admin/users/${userId}/export`)
    return res.data.data
  },

  bulkBanUsers: async (userIds: string[], reason: string): Promise<AdminBulkBanResult> => {
    const res = await api.post('/admin/users/bulk-ban', { userIds, reason })
    return res.data.data
  },

  getAdminActions: async (params: {
    adminId?: string
    targetUserId?: string
    action?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<{ actions: AdminAction[]; pagination: Pagination }> => {
    const q = new URLSearchParams()
    if (params.adminId)      q.set('adminId',      params.adminId)
    if (params.targetUserId) q.set('targetUserId', params.targetUserId)
    if (params.action)       q.set('action',       params.action)
    if (params.dateFrom)     q.set('dateFrom',     params.dateFrom)
    if (params.dateTo)       q.set('dateTo',       params.dateTo)
    if (params.page)         q.set('page',         String(params.page))
    if (params.limit)        q.set('limit',        String(params.limit))
    const res = await api.get(`/admin/actions?${q}`)
    return res.data.data
  },
}

// ── Analytics ──────────────────────────────────────────────────────────────

export const adminAnalyticsApi = {
  getSystemOverview: async (): Promise<AdminAnalyticsOverview> => {
    const res = await api.get('/admin/analytics/overview')
    return res.data.data
  },

  getUserBehavior: async (): Promise<AdminUserBehavior> => {
    const res = await api.get('/admin/analytics/user-behavior')
    return res.data.data
  },

  getCohortAnalysis: async (months = 6): Promise<{ cohorts: AdminCohortData[] }> => {
    const res = await api.get(`/admin/analytics/cohorts?months=${months}`)
    return res.data.data
  },

  generateReport: async (data: {
    name: string
    type: string
    startDate: string
    endDate: string
    metrics: string[]
    format: string
  }): Promise<{ report: AdminReport }> => {
    const res = await api.post('/admin/analytics/reports/generate', data)
    return res.data.data
  },

  getReports: async (
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ reports: AdminReport[]; pagination: Pagination }> => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) q.set('status', status)
    const res = await api.get(`/admin/analytics/reports?${q}`)
    return res.data.data
  },

  getApiUsage: async (hours = 24): Promise<AdminApiUsage> => {
    const res = await api.get(`/admin/analytics/api-usage?hours=${hours}`)
    return res.data.data
  },

  getErrorLogs: async (params: {
    level?: string
    hours?: number
    resolved?: boolean
    limit?: number
  }): Promise<AdminErrorLogs> => {
    const q = new URLSearchParams()
    if (params.level    !== undefined) q.set('level',    params.level)
    if (params.hours    !== undefined) q.set('hours',    String(params.hours))
    if (params.resolved !== undefined) q.set('resolved', String(params.resolved))
    if (params.limit    !== undefined) q.set('limit',    String(params.limit))
    const res = await api.get(`/admin/analytics/errors?${q}`)
    return res.data.data
  },

  resolveError: async (errorId: string) => {
    const res = await api.post(`/admin/analytics/errors/${errorId}/resolve`)
    return res.data.data
  },

  getSystemHealth: async (): Promise<AdminSystemHealth> => {
    const res = await api.get('/admin/analytics/health')
    return res.data.data
  },

  getPerformanceMetrics: async (hours = 24): Promise<AdminPerformanceMetrics> => {
    const res = await api.get(`/admin/analytics/performance?hours=${hours}`)
    return res.data.data
  },
}

// ── AI Question Management ─────────────────────────────────────────────────

export const adminAIQuestionApi = {
  getPendingReview: async (limit = 10): Promise<{ questions: AdminAIQuestion[] }> => {
    const res = await api.get(`/ai-questions/admin/pending?limit=${limit}`)
    return res.data.data
  },

  approveQuestion: async (questionId: string): Promise<{ question: AdminAIQuestion }> => {
    const res = await api.post(`/ai-questions/${questionId}/approve`)
    return res.data.data
  },

  getStatistics: async (): Promise<AdminAIQuestionStats> => {
    const res = await api.get('/ai-questions/admin/statistics')
    return res.data.data
  },

  getQuestion: async (questionId: string): Promise<{ question: AdminAIQuestion }> => {
    const res = await api.get(`/ai-questions/${questionId}`)
    return res.data.data
  },
}
