import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { interviewApi } from '@/api/interview.api'
import { useInterviewStore } from '@/store/interviewStore'
import { useAuthStore } from '@/store/authStore'
import type { StartInterviewRequest, SubmitAnswerRequest, InterviewType, Difficulty } from '@/types'
import { queryClient } from '@/lib/queryClient'

export function useStartInterview() {
  const { user } = useAuthStore()
  const { startSession } = useInterviewStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: Omit<StartInterviewRequest, 'userId'>) =>
      interviewApi.startInterview({ ...data, userId: user!.id }),
    onSuccess: (data) => {
      startSession({
        sessionId: data.sessionId,
        type: data.type as InterviewType,
        difficulty: 'medium' as Difficulty,
        currentQuestion: data.currentQuestion,
        totalQuestions: data.totalQuestions,
      })
      navigate(`/interview/${data.sessionId}`)
    },
  })
}

export function useSubmitAnswer() {
  const { user } = useAuthStore()
  const { recordAnswer, setCurrentQuestion, completeSession, currentQuestionIndex } = useInterviewStore()

  return useMutation({
    mutationFn: (data: Omit<SubmitAnswerRequest, 'userId'>) =>
      interviewApi.submitAnswer({ ...data, userId: user!.id }),
    onSuccess: (data, variables) => {
      const { sessionId, answer } = variables
      if (data.nextQuestion) {
        recordAnswer(variables.sessionId, answer, data.score, data.feedback)
        setCurrentQuestion(data.nextQuestion, currentQuestionIndex + 1)
      } else {
        completeSession(data.score)
        queryClient.invalidateQueries({ queryKey: ['analytics'] })
        queryClient.invalidateQueries({ queryKey: ['progress'] })
      }
    },
  })
}

export function useRequestHint(sessionId: string) {
  return useMutation({
    mutationFn: () => interviewApi.getHint(sessionId),
  })
}

export function useSessionStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'session', sessionId],
    queryFn: () => interviewApi.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  })
}

export function useTimerStatus(sessionId: string | null, enabled = false) {
  return useQuery({
    queryKey: ['interview', 'timer', sessionId],
    queryFn: () => interviewApi.getTimerStatus(sessionId!),
    enabled: !!sessionId && enabled,
    refetchInterval: 5000,
  })
}

export function usePauseSession() {
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.pauseSession(sessionId),
  })
}

export function useResumeSession() {
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.resumeSession(sessionId),
  })
}

export function useReplayHistory() {
  return useQuery({
    queryKey: ['interview', 'replay', 'history'],
    queryFn: interviewApi.getReplayHistory,
  })
}

export function useReplay(sessionId: string | null) {
  return useQuery({
    queryKey: ['interview', 'replay', sessionId],
    queryFn: () => interviewApi.getReplay(sessionId!),
    enabled: !!sessionId,
  })
}

export function useRateQuestion() {
  return useMutation({
    mutationFn: ({ questionId, rating, comment }: { questionId: string; rating: number; comment?: string }) =>
      interviewApi.rateQuestion(questionId, rating, comment),
  })
}
