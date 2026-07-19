// src/types/panelist.ts
//
// Types for the Panelist interview endpoints — the session-aware code and
// drawing submission routes, the structured transcript, the end-of-session
// report, and the recruiter view.
//
// These mirror the backend's response shapes. Where the backend redacts data
// (hidden test cases) the type reflects the redacted form, so the UI cannot
// accidentally assume it has the real input.

import type { ProgrammingLanguage, TestCase, TestCaseResult } from './interview-extended';

// ── Code submission ────────────────────────────────────────────────────────

export interface SubmitCodeRequest {
  code: string;
  language?: ProgrammingLanguage;
  /** Omit to use the stored cases for the question — the graded ones. */
  testCases?: TestCase[];
  question?: string;
  questionIndex?: number;
  /** false = trial run: executes and returns results, but no AI evaluation. */
  final?: boolean;
  /**
   * Hold the interview on this question so the follow-up can be put to the
   * candidate. The caller must then answer or skip it via answerFollowUp,
   * which advances the session.
   */
  awaitFollowUp?: boolean;
}

/**
 * A hidden case is executed and counted, but its input and expected output come
 * back as the literal string '[hidden]'.
 */
export interface PanelistTestCaseResult extends TestCaseResult {
  stdout?: string;
}

export interface PanelistExecutionResult {
  success: boolean;
  testCasesPassed: number;
  testCasesTotal: number;
  testCaseResults: PanelistTestCaseResult[];
  executionTime?: number;
  memory?: number;
  compileError?: string;
  /** Which sandbox ran it — surfaced for the demo. */
  provider?: string;
}

export interface SubmitCodeResponse {
  execution: PanelistExecutionResult;
  evaluated: boolean;
  /** Present only when evaluated (final submissions). */
  evaluation?: string;
  score?: number;
  allTestsPassed?: boolean;
  /** Adaptive follow-up referencing something specific in the submission. */
  followUp?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  /**
   * A graded submission also advances the interview, so the next question
   * arrives with the feedback — no second call needed.
   */
  nextQuestion?: {
    id: string;
    question: string;
    difficulty?: string;
    category?: string;
    hints?: string[];
  } | null;
  sessionCompleted?: boolean;
  /** True when the caller must now conduct the follow-up turn. */
  awaitingFollowUp?: boolean;
}

export interface AnswerFollowUpRequest {
  answer?: string;
  questionIndex?: number;
  /** Record that the candidate had nothing to add, and move on. */
  skipped?: boolean;
}

export interface AnswerFollowUpResponse {
  recorded: boolean;
  nextQuestion?: { id: string; question: string } | null;
  sessionCompleted?: boolean;
}

// ── Drawing submission ─────────────────────────────────────────────────────

export interface SubmitDrawingRequest {
  /** Raw Excalidraw scene: { elements, appState }. */
  scene: unknown;
  explanation?: string;
  question?: string;
  questionIndex?: number;
}

export interface SubmitDrawingResponse {
  evaluation: string;
  score: number;
  followUp: string;
  strengths: string[];
  gaps: string[];
  /**
   * How the backend read the canvas. Worth showing the candidate: if the AI
   * missed a component, that is usually because it was unlabelled or its arrow
   * was not connected, which is actionable feedback.
   */
  interpretedAs: {
    description: string;
    components: string[];
    connections: string[];
  };
  /** A graded design also advances the interview, as a code submission does. */
  nextQuestion?: {
    id: string;
    question: string;
    difficulty?: string;
    category?: string;
    hints?: string[];
  } | null;
  sessionCompleted?: boolean;
}

// ── Transcript ─────────────────────────────────────────────────────────────

export type SessionEventType =
  | 'QUESTION'
  | 'ANSWER'
  | 'CODE_SUBMIT'
  | 'TEST_RESULT'
  | 'DRAWING_SUBMIT'
  | 'FOLLOW_UP'
  | 'HINT'
  | 'EVALUATION'
  | 'REPORT'
  | 'SESSION_START'
  | 'SESSION_END';

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  sequence: number;
  timestamp: string;
  questionIndex: number | null;
  payload: Record<string, unknown>;
}

export interface TranscriptResponse {
  sessionId: string;
  events: SessionEvent[];
  totalEvents: number;
}

// ── Report ─────────────────────────────────────────────────────────────────

export interface RubricScore {
  dimension: string;
  /** 1-5. */
  score: number;
  /** One sentence tied to a specific moment in the transcript. */
  justification: string;
}

export interface InterviewReport {
  sessionId: string;
  overallRating: number;
  summary: string;
  rubricScores: RubricScore[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  eventCount: number;
  generatedAt: string;
  /** True when events were recorded after this report was generated. */
  stale?: boolean;
}

// ── Recruiter view ─────────────────────────────────────────────────────────

export interface RecruiterCodeSubmission {
  sequence: number;
  timestamp: string;
  questionIndex: number | null;
  code: string;
  language: string;
  final: boolean;
  result: {
    passed: number;
    total: number;
    allPassed: boolean;
    compileError?: string;
    results: PanelistTestCaseResult[];
  } | null;
}

export interface RecruiterDrawing {
  sequence: number;
  timestamp: string;
  questionIndex: number | null;
  scene: unknown;
  description: string;
  explanation?: string;
  elementCount: number;
}

export interface RecruiterDossier {
  session: {
    id: string;
    type: string;
    role: string | null;
    difficulty: string | null;
    status: string;
    language: string | null;
    score: number | null;
    startTime: string;
    endTime: string | null;
    durationSeconds: number | null;
    totalQuestions: number;
  };
  candidate: { id: string; name: string | null; email: string };
  /**
   * Null for a practice session. Present when this interview was sat under an
   * invitation, which is what makes a hiring decision meaningful here.
   */
  invitation: {
    id: string;
    outcome: 'UNDECIDED' | 'ADVANCED' | 'REJECTED' | 'WITHDRAWN';
    outcomeAt: string | null;
    identityConfidence: 'UNBOUND' | 'EMAIL_MATCH' | 'EMAIL_MISMATCH' | 'VERIFIED';
    invitedEmail: string;
    attemptNumber: number;
    maxAttempts: number;
    templateName: string;
    allowedHints: boolean;
    companyName: string;
    /** Only the recruiter who sent it may record a decision. */
    viewerIsRecruiter: boolean;
  } | null;
  /**
   * Null when the candidate was never recorded — they declined, or the session
   * predates recording. That is a legitimate outcome, not a missing file.
   */
  recording: {
    id: string;
    status: 'RECORDING' | 'READY' | 'INTERRUPTED' | 'FAILED';
    durationSeconds: number | null;
    sizeBytes: number;
    consentedAt: string;
    completedAt: string | null;
    streamUrl: string;
  } | null;
  questions: Array<{
    questionIndex: number;
    question: string;
    category: string;
    difficulty: string | null;
    score: number | null;
    isCorrect: boolean | null;
    hintsUsed: number;
    timeSpent: number | null;
  }>;
  codeSubmissions: RecruiterCodeSubmission[];
  drawings: RecruiterDrawing[];
  transcript: SessionEvent[];
  report: InterviewReport | null;
  /** Set when the report could not be generated — show instead of the report. */
  reportError: string | null;
  viewerIsOwner: boolean;
}
