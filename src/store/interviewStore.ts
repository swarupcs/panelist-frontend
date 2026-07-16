import { create } from 'zustand'
import type { InterviewQuestion, InterviewType, Difficulty } from '@/types'

interface InterviewState {
  sessionId: string | null
  type: InterviewType | null
  difficulty: Difficulty | null
  currentQuestion: InterviewQuestion | null
  currentQuestionIndex: number
  totalQuestions: number
  score: number | null
  isCompleted: boolean
  isPaused: boolean
  answers: Record<string, { answer: string; score?: number; feedback?: string }>

  startSession: (data: {
    sessionId: string
    type: InterviewType
    difficulty: Difficulty
    currentQuestion: InterviewQuestion
    totalQuestions: number
  }) => void
  setCurrentQuestion: (question: InterviewQuestion | null, index: number) => void
  recordAnswer: (questionId: string, answer: string, score?: number, feedback?: string) => void
  completeSession: (score: number) => void
  setPaused: (paused: boolean) => void
  resetSession: () => void
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: null,
  type: null,
  difficulty: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  totalQuestions: 0,
  score: null,
  isCompleted: false,
  isPaused: false,
  answers: {},

  startSession: (data) => set({
    sessionId: data.sessionId,
    type: data.type,
    difficulty: data.difficulty,
    currentQuestion: data.currentQuestion,
    totalQuestions: data.totalQuestions,
    currentQuestionIndex: 0,
    isCompleted: false,
    isPaused: false,
    score: null,
    answers: {},
  }),

  setCurrentQuestion: (question, index) => set({
    currentQuestion: question,
    currentQuestionIndex: index,
  }),

  recordAnswer: (questionId, answer, score, feedback) => set((state) => ({
    answers: {
      ...state.answers,
      [questionId]: { answer, score, feedback },
    },
  })),

  completeSession: (score) => set({ isCompleted: true, score, currentQuestion: null }),

  setPaused: (paused) => set({ isPaused: paused }),

  resetSession: () => set({
    sessionId: null,
    type: null,
    difficulty: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    score: null,
    isCompleted: false,
    isPaused: false,
    answers: {},
  }),
}))
