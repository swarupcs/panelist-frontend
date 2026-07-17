// src/types/admin.ts  (FULL REPLACEMENT)
import type { Pagination } from '@/types'

export type { Pagination }

// ============================================================
// Dashboard Stats
// ============================================================
export interface AdminDashboardStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  activeUsers: number
  bannedUsers: number
  suspendedUsers: number
  byRole: { free: number; premium: number; admin: number }
}

// ============================================================
// User List Item
// ============================================================
export interface AdminUserListItem {
  id: string
  email: string
  name: string
  role: 'FREE' | 'PREMIUM' | 'ADMIN'
  emailVerified: boolean
  isActive: boolean
  isBanned: boolean
  isSuspended: boolean
  isSuspicious: boolean
  createdAt: string
  lastLogin?: string | null
  profilePicture?: string | null
  bannedAt?: string | null
  suspendedUntil?: string | null
  _count: { interviewSessions: number; achievements: number }
}

// ============================================================
// User Details  (GET /admin/users/:userId)
// ============================================================
export interface AdminUserStats {
  totalInterviews: number
  completedInterviews: number
  completionRate: number
  avgScore: number
  totalTimeSpent: number
  questionsSolved: number
  currentStreak: number
  accountAge: number
  daysSinceLastLogin: number | null
}

export interface AdminUserBanRecord {
  id: string
  reason: string
  isPermanent: boolean
  bannedBy: string
  createdAt: string
  unbannedAt?: string | null
  unbannedBy?: string | null
}

export interface AdminUserSuspensionRecord {
  id: string
  reason: string
  duration: number
  expiresAt: string
  suspendedBy: string
  createdAt: string
  endedAt?: string | null
  endedBy?: string | null
}

export interface AdminRefreshToken {
  id: string
  createdAt: string
  expiresAt: string
}

export interface AdminUserAchievementDetail {
  id: string
  unlockedAt: string
  achievement: {
    id: string
    code: string
    title: string
    description: string
    icon: string
    points: number
  }
}

export interface AdminWeakArea {
  topic: string
  category: string
  failureCount: number
  lastEncountered: string
  improvementSuggestions: string[]
}

export interface AdminUserDetails {
  user: AdminUserListItem & {
    adminNotes?: string | null
    banReason?: string | null
    suspensionReason?: string | null
    oauthProvider?: string | null
    bans?: AdminUserBanRecord[]
    suspensions?: AdminUserSuspensionRecord[]
    refreshTokens?: AdminRefreshToken[]
    achievements?: AdminUserAchievementDetail[]
    weakAreas?: AdminWeakArea[]
  }
  stats: AdminUserStats
  recentActivity: AdminActivityLog[]
}

// ============================================================
// Activity Log
// ============================================================
export interface AdminActivityLog {
  id: string
  action: string
  endpoint: string
  method: string
  statusCode: number
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

// ============================================================
// Admin Action (Audit Log)
// ============================================================
export interface AdminAction {
  id: string
  adminId: string
  targetUserId?: string | null
  targetType: string
  action: string
  reason?: string | null
  changes?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  admin: { id: string; name: string; email: string }
  targetUser?: { id: string; name: string; email: string } | null
}

// ============================================================
// Bulk Operation
// ============================================================
export interface AdminBulkBanResult {
  operationId: string
  successCount: number
  failureCount: number
  results: Array<{ userId: string; success: boolean }>
}

// ============================================================
// Analytics — System Overview
// ============================================================
export interface DailyCount {
  date: string
  count: number
}

export interface DailyInterviewTrend {
  date: string
  count: number
  avgScore: number
}

export interface AdminAnalyticsOverview {
  users: {
    total: number
    growth: { daily: number; weekly: number; monthly: number }
    active: { dau: number; wau: number; mau: number; dauWauRatio: number }
    retention: { day1: number; day7: number; day30: number }
    churn: { rate: number; trend: string }
    byRole: Record<string, number>
    trends: DailyCount[]
  }
  interviews: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    avgScore: number
    avgDuration: number
    completionRate: number
    byType: Record<string, number>
    byDifficulty: Record<string, number>
    trends: DailyInterviewTrend[]
  }
  questions: {
    total: number
    aiGenerated: number
    manual: number
    pending: number
    approved: number
    avgRating: number
    mostAttempted: Array<{ category: string; attempts: number }>
  }
  engagement: {
    avgSessionDuration: number
    questionsAttempted: number
    hintsUsed: number | string
    achievementsUnlocked: number
    topFeatures: Array<{ feature: string; usage: number }>
  }
  system: {
    dbStatus: string
    avgResponseTime: number
    errorRate: number
    totalRequestsLast24h: number
    totalRequestsLastHour: number
  }
  generatedAt: string
}

// ============================================================
// Analytics — User Behavior
// ============================================================
export interface HeatmapEntry {
  hour: number
  count: number
}

export interface AdminUserBehavior {
  featureAdoption: {
    spacedRepetition: number
    companyPractice: number
    topicPractice: number
    aiQuestions: number
  }
  timeOfDay: {
    heatmap: HeatmapEntry[]
    peakHours: number[]
    peakDays: string[]
  }
  deviceBreakdown: Record<string, unknown>
}

// ============================================================
// Analytics — Cohort Analysis
// ============================================================
export interface AdminCohortData {
  id: string
  cohortMonth: string
  totalUsers: number
  month0: number
  month1?: number | null
  month2?: number | null
  month3?: number | null
  month4?: number | null
  month5?: number | null
  month6?: number | null
}

// ============================================================
// Analytics — Reports
// ============================================================
export type ReportFormat = 'JSON' | 'CSV' | 'PDF'
export type ReportStatus = 'GENERATING' | 'COMPLETED' | 'FAILED'

export interface AdminReport {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  metrics: string[]
  format: ReportFormat
  status: ReportStatus
  fileUrl?: string | null
  fileSize?: number | null
  generatedBy: string
  generatedAt?: string | null
  errorMessage?: string | null
  createdAt: string
}

// ============================================================
// Analytics — API Usage
// ============================================================
export interface ApiEndpointStat {
  endpoint: string
  method: string
  count: number
  avgTime: number
  maxTime: number
}

export interface AdminApiUsage {
  requests: ApiEndpointStat[]
  byStatusCode: Record<number, number>
  slowestEndpoints: Array<{ endpoint: string; avgTime: number }>
  topUsers: Array<{ userId: string | null; requests: number }>
}

// ============================================================
// Analytics — Error Logs
// ============================================================
export interface AdminErrorLog {
  id: string
  level: string
  message: string
  stack?: string | null
  endpoint?: string | null
  method?: string | null
  statusCode?: number | null
  userId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  resolved: boolean
  resolvedAt?: string | null
  resolvedBy?: string | null
  timestamp: string
}

export interface AdminErrorLogs {
  errors: AdminErrorLog[]
  summary: {
    total: number
    critical: number
    byEndpoint: Record<string, number>
  }
}

// ============================================================
// Analytics — System Health
// ============================================================
export interface AdminSystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  lastCheck: string
  services: {
    api: { status: string; responseTime: number }
    database: { status: string }
    redis: { status: string }
  }
  metrics: {
    avgResponseTime: number
    errorRate: number
    requestsPerMinute: number
  }
}

// ============================================================
// Analytics — Performance Metrics
// ============================================================
export interface AdminPerformanceMetrics {
  responseTime: { p50: number; p95: number; p99: number }
  throughput: number
  errorRate: number
}

// ============================================================
// AI Question Management
// ============================================================
export interface AdminAIQuestion {
  id: string
  question: string
  description?: string | null
  difficulty: string
  category: string
  subcategory?: string | null
  hints: string[]
  solution: string
  sampleCode: string
  explanation: string
  testCases: Array<{ input: unknown; expectedOutput: unknown; explanation?: string }>
  timeComplexity?: string | null
  spaceComplexity?: string | null
  generationType: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  isApproved: boolean
  approvedBy?: string | null
  approvedAt?: string | null
  timesUsed: number
  createdAt: string
  baseQuestion?: { id: string; question: string } | null
}

export interface AdminAIQuestionStats {
  total: number
  byType: Array<{ generationType: string; _count: { id: number } }>
  byStatus: Array<{ status: string; _count: { id: number } }>
  recentGenerations: Array<{
    id: string
    question: string
    difficulty: string
    category: string
    status: string
    createdAt: string
  }>
}

// ============================================================
// UI-only helpers
// ============================================================
export type AdminTab =
  | 'overview'
  | 'users'
  | 'analytics'
  | 'system'
  | 'audit'
  | 'reports'
  | 'ai-questions'

export type UserFilterStatus = 'all' | 'active' | 'banned' | 'suspended' | 'inactive'
export type UserSortField    = 'createdAt' | 'lastLogin' | 'email' | 'name'
