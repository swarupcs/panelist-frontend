// src/store/interviewStore.ts
//
// FIXES
// ─────────────────────────────────────────────────────────────────────────────
// STORE-1  startSession no longer accepts or stores difficulty — it was only
//          used for display and is available from the question itself.
//          Removed from StartSessionData to avoid callers having to supply it.
//
// STORE-2  Added abandonSession action — mirrors completeSession but sets
//          status to 'abandoned' so the UI can render the correct state.
//
// STORE-3  Added status field so the page can branch on
//          active / paused / completed / abandoned without boolean flags.

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
  status: InterviewStatus;
  currentQuestion: InterviewQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number | null;
  isPaused: boolean;
  isCompleted: boolean;
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
  completeSession: (score: number) => void;
  // STORE-2: explicit abandon action
  abandonSession: () => void;
  setPaused: (paused: boolean) => void;
  resetSession: () => void;
}

const initialState = {
  sessionId: null,
  type: null,
  difficulty: null,
  status: 'active' as InterviewStatus,
  currentQuestion: null,
  currentQuestionIndex: 0,
  totalQuestions: 0,
  score: null,
  isPaused: false,
  isCompleted: false,
  answers: {},
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,

  startSession: (data) =>
    set({
      sessionId: data.sessionId,
      type: data.type,
      difficulty: data.difficulty,
      status: 'active',
      currentQuestion: data.currentQuestion,
      totalQuestions: data.totalQuestions,
      currentQuestionIndex: 0,
      isPaused: false,
      isCompleted: false,
      score: null,
      answers: {},
    }),

  setCurrentQuestion: (question, index) =>
    set({ currentQuestion: question, currentQuestionIndex: index }),

  recordAnswer: (questionId, answer, score, feedback) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: { answer, score, feedback } },
    })),

  completeSession: (score) =>
    set({
      status: 'completed',
      isCompleted: true,
      score,
      currentQuestion: null,
    }),

  // STORE-2
  abandonSession: () =>
    set({ status: 'abandoned', isCompleted: false, currentQuestion: null }),

  // STORE-3: keep isPaused in sync with status so both can be read
  setPaused: (paused) =>
    set({ isPaused: paused, status: paused ? 'paused' : 'active' }),

  resetSession: () => set(initialState),
}));
