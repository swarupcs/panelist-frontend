// src/store/interviewSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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

export interface InterviewState {
  sessionId: string | null;
  type: InterviewType | null;
  difficulty: Difficulty | null;
  status: InterviewStatus;
  isPaused: boolean;
  isCompleted: boolean;
  currentQuestion: InterviewQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number | null;
  answers: Record<string, AnswerRecord>;
}

const initialState: InterviewState = {
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

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startSession(state, action: PayloadAction<StartSessionData>) {
      // Reset state first
      Object.assign(state, initialState);
      state.sessionId = action.payload.sessionId;
      state.type = action.payload.type;
      state.difficulty = action.payload.difficulty;
      state.currentQuestion = action.payload.currentQuestion;
      state.totalQuestions = action.payload.totalQuestions;
    },
    setCurrentQuestion(
      state,
      action: PayloadAction<{ question: InterviewQuestion | null; index: number }>,
    ) {
      state.currentQuestion = action.payload.question;
      state.currentQuestionIndex = action.payload.index;
    },
    recordAnswer(
      state,
      action: PayloadAction<{
        questionId: string;
        answer: string;
        score?: number;
        feedback?: string;
      }>,
    ) {
      state.answers[action.payload.questionId] = {
        answer: action.payload.answer,
        score: action.payload.score,
        feedback: action.payload.feedback,
      };
    },
    setPaused(state, action: PayloadAction<boolean>) {
      state.isPaused = action.payload;
      state.status = action.payload ? 'paused' : 'active';
    },
    completeSession(state, action: PayloadAction<number>) {
      state.status = 'completed';
      state.isCompleted = true;
      state.isPaused = false;
      state.score = action.payload;
      state.currentQuestion = null;
    },
    abandonSession(state) {
      state.status = 'abandoned';
      state.isCompleted = false;
      state.isPaused = false;
      state.currentQuestion = null;
    },
    resetSession(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  startSession,
  setCurrentQuestion,
  recordAnswer,
  setPaused,
  completeSession,
  abandonSession,
  resetSession,
} = interviewSlice.actions;

export default interviewSlice.reducer;
