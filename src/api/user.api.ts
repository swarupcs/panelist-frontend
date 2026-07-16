import api from './axios'
import type {
  LearningPath, SpacedRepetitionStats, ReviewSchedule,
  SpacedRepetitionItem, Recommendation,
  UserProgressData, UserPreferences, LoginHistoryItem,
  UserAchievement, LeaderboardEntry,
  FileUpload,
} from '@/types'

// ── Learning Path ──────────────────────────────────────────────────────────

export const learningApi = {
  generatePath: async (data: {
    targetRole: string
    currentLevel: string
    targetDate?: string
    weeklyHours?: number
  }): Promise<{ learningPath: LearningPath }> => {
    const res = await api.post('/learning-path/generate', data)
    return res.data.data
  },

  getPath: async (): Promise<{ learningPath: LearningPath }> => {
    const res = await api.get('/learning-path')
    return res.data.data
  },

  completeTopic: async (topicId: string) => {
    const res = await api.post(`/learning-path/topics/${topicId}/complete`)
    return res.data.data
  },

  updateTopicProgress: async (topicId: string, questionsSolved: number, averageScore: number) => {
    const res = await api.patch(`/learning-path/topics/${topicId}/progress`, {
      questionsSolved, averageScore,
    })
    return res.data.data
  },

  getRecommendations: async (): Promise<{ recommendations: Recommendation[] }> => {
    const res = await api.get('/learning-path/recommendations')
    return res.data.data
  },

  generateRecommendations: async (): Promise<{ recommendations: Recommendation[] }> => {
    const res = await api.post('/learning-path/recommendations/generate')
    return res.data.data
  },

  completeRecommendation: async (id: string) => {
    const res = await api.post(`/learning-path/recommendations/${id}/complete`)
    return res.data.data
  },

  getDueReviews: async (limit = 10): Promise<{
    reviews: SpacedRepetitionItem[]
    stats: SpacedRepetitionStats
    schedule: ReviewSchedule[]
  }> => {
    const res = await api.get(`/learning-path/reviews?limit=${limit}`)
    return res.data.data
  },

  recordReview: async (itemId: string, quality: number) => {
    const res = await api.post(`/learning-path/reviews/${itemId}`, { quality })
    return res.data.data
  },
}

// ── Progress ───────────────────────────────────────────────────────────────

export const progressApi = {
  getProgress: async (userId: string): Promise<UserProgressData> => {
    const res = await api.get(`/progress/${userId}`)
    return res.data.data
  },

  getWeakAreas: async (userId: string, limit = 5) => {
    const res = await api.get(`/progress/${userId}/weak-areas?limit=${limit}`)
    return res.data.data
  },
}

// ── User ───────────────────────────────────────────────────────────────────

export const userApi = {
  updateProfile: async (data: { name?: string; profilePicture?: string }) => {
    const res = await api.patch('/user/profile', data)
    return res.data.data
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.post('/user/change-password', data)
    return res.data.data
  },

  getLoginHistory: async (limit = 10): Promise<{ loginHistory: LoginHistoryItem[] }> => {
    const res = await api.get(`/user/login-history?limit=${limit}`)
    return res.data.data
  },

  getPreferences: async (): Promise<{ preferences: UserPreferences | null }> => {
    const res = await api.get('/user/preferences')
    return res.data.data
  },

  updatePreferences: async (data: Partial<UserPreferences>) => {
    const res = await api.patch('/user/preferences', data)
    return res.data.data
  },

  deleteAccount: async (data: { password?: string; confirmation: string }) => {
    const res = await api.delete('/user/account', { data })
    return res.data.data
  },

  exportData: async () => {
    const res = await api.get('/user/export')
    return res.data.data
  },
}

// ── Gamification ───────────────────────────────────────────────────────────

export const gamificationApi = {
  getAchievements: async (): Promise<{ achievements: UserAchievement[] }> => {
    const res = await api.get('/gamification/achievements')
    return res.data.data
  },

  getLeaderboard: async (limit = 10): Promise<{ leaderboard: LeaderboardEntry[] }> => {
    const res = await api.get(`/gamification/leaderboard?limit=${limit}`)
    return res.data.data
  },

  updateDailyGoal: async (minutesStudied: number, questionsAnswered: number) => {
    const res = await api.post('/gamification/daily-goal', { minutesStudied, questionsAnswered })
    return res.data.data
  },
}

// ── File Upload ────────────────────────────────────────────────────────────

export const fileApi = {
  uploadFile: async (file: File, category: string): Promise<FileUpload> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    const res = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  getUserFiles: async (category?: string): Promise<{ files: FileUpload[] }> => {
    const url = category ? `/files?category=${category}` : '/files'
    const res = await api.get(url)
    return res.data.data
  },

  deleteFile: async (fileId: string) => {
    const res = await api.delete(`/files/${fileId}`)
    return res.data.data
  },

  getSignedUrl: async (fileId: string): Promise<{ url: string }> => {
    const res = await api.get(`/files/${fileId}/url`)
    return res.data.data
  },
}

// ── Resume ─────────────────────────────────────────────────────────────────

export const resumeApi = {
  reviewResume: async (data: {
    userId: string
    resumeText: string
    targetRole?: string
    targetCompanies?: string[]
  }) => {
    const res = await api.post('/resume/review', data)
    return res.data.data
  },
}
