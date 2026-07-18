import api from './axios'
import type {
  LearningPath, SpacedRepetitionStats, ReviewSchedule,
  SpacedRepetitionItem, Recommendation,
  UserProgressData, UserPreferences, LoginHistoryItem,
  UserAchievement, LeaderboardEntry, DailyQuest, GamificationStats,
  FileUpload,
} from '@/types'

// ── Learning Path ──────────────────────────────────────────────────────────

export const learningApi = {
  generatePath: async (data: {
    targetRole: string
    currentLevel: string
    targetDate?: string
    weeklyHours?: number
    targetCompanies?: string
    weaknesses?: string
  }): Promise<{ learningPath: LearningPath }> => {
    const res = await api.post('/learning-path/generate', data)
    return res.data.data
  },

  adaptPath: async (data: {
    weakCategory: string
    feedback?: string
  }): Promise<{ phase: any }> => {
    const res = await api.post('/learning-path/adapt', data)
    return res.data.data
  },

  getPath: async (pathId?: string): Promise<{ learningPath: LearningPath }> => {
    const url = pathId ? `/learning-path?pathId=${pathId}` : '/learning-path'
    const res = await api.get(url)
    return res.data.data
  },

  getAllPaths: async (): Promise<{ paths: LearningPath[] }> => {
    const res = await api.get('/learning-path/all')
    return res.data.data
  },

  savePath: async (pathId: string, isSaved: boolean = true) => {
    const res = await api.put(`/learning-path/${pathId}/save`, { isSaved })
    return res.data.data
  },

  setActivePath: async (pathId: string) => {
    const res = await api.put(`/learning-path/${pathId}/activate`)
    return res.data.data
  },

  deletePath: async (pathId: string) => {
    const res = await api.delete(`/learning-path/${pathId}`)
    return res.data.data
  },

  completeTopic: async (topicId: string) => {
    const res = await api.post(`/learning-path/topics/${topicId}/complete`)
    return res.data.data
  },

  getCrashCourse: async (topicId: string) => {
    const res = await api.get(`/learning-path/topics/${topicId}/crash-course`)
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

  updateTargetDate: async (pathId: string, targetDate: string | null): Promise<{ learningPath: LearningPath }> => {
    const res = await api.patch(`/learning-path/${pathId}/target-date`, { targetDate })
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
  updateProfile: async (data: { name?: string; profilePicture?: string; username?: string; bio?: string }) => {
    const res = await api.patch('/user/profile', data)
    return res.data.data
  },

  getPublicProfile: async (username: string) => {
    const res = await api.get(`/users/public/${username}`)
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

  getActivity: async (): Promise<{ activity: { date: string, count: number, level: number }[] }> => {
    const res = await api.get('/gamification/activity')
    return res.data.data
  },

  getDailyQuests: async (): Promise<{ quests: DailyQuest[] }> => {
    const res = await api.get('/gamification/quests')
    return res.data.data
  },

  claimQuestXP: async (questType: string): Promise<{ xpAwarded: number; xp: number; level: number; xpToNextLevel: number }> => {
    const res = await api.post(`/gamification/quests/${questType}/claim`)
    return res.data.data
  },

  getStats: async (): Promise<{ stats: GamificationStats }> => {
    const res = await api.get('/gamification/stats')
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

  /**
   * Text extracted from the document when it was uploaded.
   *
   * `text` is null when the file could not be read — a scanned PDF, or a
   * legacy .doc — and `extractionReason` says which, so the UI can explain it
   * rather than showing an empty box.
   */
  getFileText: async (
    fileId: string,
  ): Promise<{ id: string; originalName: string; text: string | null; extractionReason?: string }> => {
    const res = await api.get(`/files/${fileId}/text`)
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
