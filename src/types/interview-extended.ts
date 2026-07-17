// src/types/interview-extended.ts
// New types for features that exist in the backend but were missing from types/index.ts

// ── Code Execution ─────────────────────────────────────────────────────────

export type ProgrammingLanguage =
  | 'JAVASCRIPT'
  | 'TYPESCRIPT'
  | 'PYTHON'
  | 'JAVA'
  | 'CPP'
  | 'CSHARP'
  | 'GO'
  | 'RUST'
  | 'SWIFT'
  | 'KOTLIN';

export interface TestCase {
  input: Record<string, unknown>;
  expectedOutput: unknown;
  explanation?: string;
}

export interface TestCaseResult {
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  passed: boolean;
  executionTime?: number;
}

export interface CodeExecutionRequest {
  code: string;
  language: ProgrammingLanguage;
  testCases: TestCase[];
}

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memory?: number;
  testCasesPassed: number;
  testCasesTotal: number;
  testCaseResults: TestCaseResult[];
}

// ── Replay ─────────────────────────────────────────────────────────────────

export type ReplayStepType = 'question' | 'answer' | 'hint' | 'feedback';

export interface ReplayStep {
  stepNumber: number;
  timestamp: string;
  type: ReplayStepType;
  data: Record<string, unknown>;
}

export interface ReplaySession {
  id: string;
  type: string;
  role?: string;
  startTime: string;
  endTime?: string;
  totalQuestions: number;
  score?: number;
}

export interface ReplayRecording {
  session: ReplaySession;
  timeline: ReplayStep[];
  totalSteps: number;
}

export interface ReplayData {
  replayId: string;
  recording: ReplayRecording;
}

export interface ReplayHistoryItem {
  id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  currentStep: number;
  totalSteps: number;
  playbackSpeed: number;
  session: {
    type: string;
    role?: string;
    score?: number;
    startTime: string;
    totalQuestions: number;
  };
}

// ── Compare Attempts ───────────────────────────────────────────────────────

export interface AttemptSummary {
  id: string;
  date: string;
  score?: number;
  timeSpent?: number;
  questionsCorrect: number;
}

export interface CompareResult {
  session1: AttemptSummary;
  session2: AttemptSummary;
  improvement: {
    scoreDelta: number;
    timeDelta: number;
    correctDelta: number;
  };
}

// ── Interview History ──────────────────────────────────────────────────────

export interface InterviewHistoryItem {
  id: string;
  type: string;
  status: string;
  difficulty?: string;
  score?: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  feedback?: string;
}

export interface InterviewHistoryResponse {
  sessions: InterviewHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Question Rating ────────────────────────────────────────────────────────

export interface QuestionRatings {
  officialDifficulty: string;
  communityDifficulty: number | null;
  totalRatings: number;
  ratingDistribution: { rating: number; count: number }[];
  recentRatings: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }[];
}

// ── Adaptive Interview ─────────────────────────────────────────────────────

export interface AdaptiveQuestionResponse {
  question: unknown; // same shape as InterviewQuestion array from question bank
}
