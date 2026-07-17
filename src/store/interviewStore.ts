// src/store/interviewStore.ts

import { create } from 'zustand';
import type {
  InterviewQuestion,
  InterviewType,
  Difficulty,
  InterviewStatus,
} from '@/types';

interface AnswerRecord {
  answer: string;
  score?: number;
  feedback?: string;
}

interface StartSessionData {
  sessionId: string;
  type: InterviewType;
  difficulty: Difficulty;
  currentQuestion: InterviewQuestion;
  totalQuestions: number;
}

interface InterviewState {
  sessionId: string | null;
  type: InterviewType | null;
  difficulty: Difficulty | null;
  // `status` is canonical. `isPaused` / `isCompleted` are derived and kept in sync.
  status: InterviewStatus;
  isPaused: boolean;
  isCompleted: boolean;
  currentQuestion: InterviewQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number | null;
  // Local answer cache — fallback when DB hasn't flushed yet
  answers: Record<string, AnswerRecord>;
  // Actions
  startSession: (data: StartSessionData) => void;
  setCurrentQuestion: (
    question: InterviewQuestion | null,
    index: number,
  ) => void;
  recordAnswer: (
    questionId: string,
    answer: string,
    score?: number,
    feedback?: string,
  ) => void;
  setPaused: (paused: boolean) => void;
  completeSession: (score: number) => void;
  abandonSession: () => void;
  resetSession: () => void;
}

const INITIAL: Pick<
  InterviewState,
  | 'sessionId'
  | 'type'
  | 'difficulty'
  | 'status'
  | 'isPaused'
  | 'isCompleted'
  | 'currentQuestion'
  | 'currentQuestionIndex'
  | 'totalQuestions'
  | 'score'
  | 'answers'
> = {
  sessionId: null,
  type: null,
  difficulty: null,
  status: 'active',
  isPaused: false,
  isCompleted: false,
  currentQuestion: null,
  currentQuestionIndex: 0,
  totalQuestions: 0,
  score: null,
  answers: {},
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...INITIAL,

  startSession: (data) =>
    set({
      ...INITIAL,
      sessionId: data.sessionId,
      type: data.type,
      difficulty: data.difficulty,
      currentQuestion: data.currentQuestion,
      totalQuestions: data.totalQuestions,
    }),

  setCurrentQuestion: (question, index) =>
    set({ currentQuestion: question, currentQuestionIndex: index }),

  recordAnswer: (questionId, answer, score, feedback) =>
    set((s) => ({
      answers: { ...s.answers, [questionId]: { answer, score, feedback } },
    })),

  setPaused: (paused) =>
    set({ isPaused: paused, status: paused ? 'paused' : 'active' }),

  completeSession: (score) =>
    set({
      status: 'completed',
      isCompleted: true,
      isPaused: false,
      score,
      currentQuestion: null,
    }),

  abandonSession: () =>
    set({
      status: 'abandoned',
      isCompleted: false,
      isPaused: false,
      currentQuestion: null,
    }),

  resetSession: () => set({ ...INITIAL }),
}));
