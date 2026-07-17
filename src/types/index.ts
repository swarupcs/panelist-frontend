// ============================================================
// Auth Types
// ============================================================
export interface User {
  id: string
  email: string
  name: string
  role: 'FREE' | 'PREMIUM' | 'ADMIN'
  emailVerified: boolean
  isActive: boolean
  isBanned: boolean
  isSuspended: boolean
  profilePicture?: string | null
  oauthProvider?: string | null
  createdAt: string
  lastLogin?: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterResponse {
  user: User
  message: string
}

// ============================================================
// Interview Types
// ============================================================
export type InterviewType = 'dsa' | 'system_design' | 'behavioral' | 'mixed'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type InterviewStatus = 'active' | 'paused' | 'completed'

export interface InterviewQuestion {
  id: string
  question: string
  difficulty: Difficulty
  category: string
  hints?: string[]
  hintsUsed?: number
  userAnswer?: string
  score?: number
  feedback?: string
  timeSpent?: number
  expectedAnswer?: string
}

export interface InterviewSession {
  sessionId: string
  type: InterviewType
  status: InterviewStatus
  totalQuestions: number
  currentQuestion: InterviewQuestion | null
  currentQuestionIndex: number
  score?: number
  startTime?: string
  endTime?: string
}

export interface StartInterviewRequest {
  userId: string
  type: InterviewType
  difficulty?: Difficulty
  duration?: number
  focusAreas?: string[]
}

export interface StartInterviewResponse {
  sessionId: string
  type: InterviewType
  status: string
  totalQuestions: number
  currentQuestion: InterviewQuestion
  currentQuestionIndex: number
}

export interface SubmitAnswerRequest {
  sessionId: string
  userId: string
  answer: string
  timeSpent?: number
}

export interface SubmitAnswerResponse {
  feedback: string
  score: number
  nextQuestion: InterviewQuestion | null
  sessionCompleted: boolean
}

export interface HintResponse {
  hint: string
}

export interface TimerStatus {
  timeRemaining: number
  isExpired: boolean
  formattedTime: string
}

// ============================================================
// Analytics Types
// ============================================================
export interface InterviewStats {
  totalInterviews: number
  completedInterviews: number
  averageScore: number
  completionRate: number
  totalTimeSpent: number
}

export interface TopicPerformance {
  topic: string
  category: string
  totalQuestions: number
  averageScore: number
  successRate: number
}

export interface PerformanceTrend {
  date: string
  averageScore: number
  interviewCount: number
}

export interface WeakArea {
  topic: string
  category: string
  failureCount: number
  lastEncountered: string
  improvementSuggestions: string[]
}

export interface UserProgress {
  totalInterviews: number
  topicsCompleted: string[]
  currentLevel: string
  goalLevel: string
}

export interface ComparativeAnalytics {
  userAverageScore: number
  globalAverageScore: number
  totalUsers: number
  userRank: number
  percentile: string | number
}

export interface SkillGap {
  skill: string
  category: string
  currentLevel: string
  targetLevel: string
  gap: number
  priority: number
}

export interface AnalyticsDashboard {
  statistics: InterviewStats
  topicPerformance: TopicPerformance[]
  performanceTrends: PerformanceTrend[]
  weakAreas: WeakArea[]
  userProgress: UserProgress | null
  comparative: ComparativeAnalytics
}

// ============================================================
// Learning Path Types
// ============================================================
export interface LearningTopic {
  id: string
  category: string
  title: string
  description?: string
  orderIndex: number
  questionsToSolve: number
  questionsSolved: number
  isCompleted: boolean
  completedAt?: string
  averageScore?: number
  prerequisites: string[]
  resources?: LearningResource[]
}

export interface LearningPhase {
  id: string
  phaseNumber: number
  title: string
  description?: string
  estimatedDays: number
  isCompleted: boolean
  completedAt?: string
  topics: LearningTopic[]
}

export interface LearningPath {
  id: string
  userId: string
  targetRole: string
  currentPhase: number
  totalPhases: number
  estimatedWeeks?: number
  targetDate?: string
  phases: LearningPhase[]
}

export interface SpacedRepetitionItem {
  id: string
  userId: string
  questionId: string
  category: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: string
  lastReviewed?: string
  isRetired: boolean
}

export interface SpacedRepetitionStats {
  totalCards: number
  dueForReview: number
  mastered: number
  learningRate: number
}

export interface ReviewSchedule {
  date: string
  reviewCount: number
}

export interface Recommendation {
  id: string
  type: string
  title: string
  description: string
  priority: number
  category?: string
  questionIds: string[]
  isCompleted: boolean
  isDismissed: boolean
  expiresAt?: string
}

// ============================================================
// Query Types
// ============================================================
export interface QueryRequest {
  query: string
  userId: string
  sessionId?: string
  useRAG?: boolean
  context?: Record<string, unknown>
}

export interface QueryResponse {
  response: string
  agentType: string
  confidence: number
  suggestedFollowUps?: string[]
}

// ============================================================
// Resume Types
// ============================================================
export interface ResumeReviewRequest {
  userId: string
  resumeText: string
  targetRole?: string
  targetCompanies?: string[]
}

export interface ResumeReviewResponse {
  review: string
  confidence: number
}

// ============================================================
// User/Profile Types
// ============================================================
export interface UserPreferences {
  difficulty: string
  focusAreas: string[]
  interviewType: string
  sessionDuration: number
  notificationsEnabled: boolean
  emailNotifications: boolean
  dailyGoalMinutes?: number
}

export interface LoginHistoryItem {
  id: string
  ipAddress: string
  userAgent: string
  loginMethod: string
  success: boolean
  createdAt: string
}

// ============================================================
// Gamification Types
// ============================================================
export interface Achievement {
  id: string
  code: string
  title: string
  description: string
  icon: string
  points: number
  isSecret: boolean
}

export interface UserAchievement {
  id: string
  achievementId: string
  unlockedAt: string
  achievement: Achievement
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  profilePicture?: string
  problemsSolved: number
  averageScore: number
  currentStreak: number
}

// ============================================================
// API Response Wrapper
// ============================================================
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  metadata?: {
    timestamp: string
    requestId?: string
  }
}

// ============================================================
// Progress Types
// ============================================================
export interface UserProgressData {
  weakAreas: WeakArea[]
  learningProgress: UserProgress | null
  recentTopics: string[]
  statistics: InterviewStats
}

// ============================================================
// File Upload Types
// ============================================================
export interface FileUpload {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  category: string
  createdAt: string
}

// ============================================================
// Admin Types
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
  lastLogin?: string
  bannedAt?: string
  suspendedUntil?: string
  _count: {
    interviewSessions: number
    achievements: number
  }
}

export interface AdminDashboardStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  activeUsers: number
  bannedUsers: number
  suspendedUsers: number
  byRole: {
    free: number
    premium: number
    admin: number
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ── Learning Resource (referenced by LearningTopic) ────────────────────────
export interface LearningResource {
  id: string
  title: string
  url: string
  type: string
  isPrimary: boolean
}
