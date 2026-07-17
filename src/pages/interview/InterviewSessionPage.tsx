import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lightbulb, Send, Pause, Play, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useInterviewStore } from '@/store/interviewStore'
import { useSubmitAnswer, useRequestHint, usePauseSession, useResumeSession } from '@/hooks/useInterview'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/common'
import { getDifficultyBadge, formatScore } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [lastFeedback, setLastFeedback] = useState<{ score: number; feedback: string } | null>(null)
  const [hints, setHints] = useState<string[]>([])
  const [showHints, setShowHints] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)

  const {
    currentQuestion, currentQuestionIndex, totalQuestions,
    isPaused, isCompleted, score,
  } = useInterviewStore()

  const submitAnswer = useSubmitAnswer()
  const requestHint = useRequestHint(sessionId!)
  const pauseSession = usePauseSession()
  const resumeSession = useResumeSession()

  // Timer
  useEffect(() => {
    if (isPaused || isCompleted) return
    const interval = setInterval(() => setTimeSpent(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isPaused, isCompleted])

  // Redirect when completed
  useEffect(() => {
    if (isCompleted) {
      setTimeout(() => navigate(`/interview/complete/${sessionId}`), 500)
    }
  }, [isCompleted, sessionId, navigate])

  const handleSubmit = () => {
    if (!answer.trim() || !sessionId) return
    submitAnswer.mutate(
      { sessionId, answer: answer.trim(), timeSpent },
      {
        onSuccess: (data) => {
          setLastFeedback({ score: data.score, feedback: data.feedback })
          setAnswer('')
          setHints([])
          setShowHints(false)
          setTimeSpent(0)
        },
      },
    )
  }

  const handleHint = () => {
    if (!sessionId) return
    requestHint.mutate(undefined, {
      onSuccess: (data) => {
        setHints(h => [...h, data.hint])
        setShowHints(true)
      },
    })
  }

  const handlePauseResume = () => {
    if (!sessionId) return
    if (isPaused) {
      resumeSession.mutate(sessionId)
    } else {
      pauseSession.mutate(sessionId)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (!currentQuestion && !isCompleted) {
    return <LoadingScreen message="Loading question..." />
  }

  const progress = totalQuestions > 0 ? ((currentQuestionIndex) / totalQuestions) * 100 : 0

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <Progress value={progress} className="w-32 h-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            <span className={cn(timeSpent > 300 && 'text-yellow-400', timeSpent > 600 && 'text-red-400')}>
              {formatTime(timeSpent)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePauseResume}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>
        </div>
      </div>

      {isPaused && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center text-sm text-yellow-400">
          Session paused. Click play to continue.
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{currentQuestion.category}</Badge>
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getDifficultyBadge(currentQuestion.difficulty))}>
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{currentQuestion.question}</p>
          </CardContent>
        </Card>
      )}

      {/* Last feedback */}
      {lastFeedback && (
        <Card className={cn(
          'border',
          lastFeedback.score >= 70 ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5',
        )}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {lastFeedback.score >= 70
                ? <CheckCircle2 className="size-4 text-green-400 shrink-0 mt-0.5" />
                : <AlertCircle className="size-4 text-yellow-400 shrink-0 mt-0.5" />
              }
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Feedback</p>
                  <span className={cn('text-xs font-bold', lastFeedback.score >= 70 ? 'text-green-400' : 'text-yellow-400')}>
                    {formatScore(lastFeedback.score)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{lastFeedback.feedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hints */}
      {hints.length > 0 && showHints && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
              <Lightbulb className="size-3" /> Hints
            </p>
            <ul className="space-y-2">
              {hints.map((hint, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-primary shrink-0">{i + 1}.</span>
                  {hint}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Answer area */}
      {currentQuestion && !isPaused && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              placeholder="Type your answer here... For code, use plain text or specify the language."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="min-h-[180px] font-mono text-sm resize-y"
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHint}
                loading={requestHint.isPending}
                className="gap-1.5 text-muted-foreground hover:text-primary"
                disabled={currentQuestion.hintsUsed !== undefined && hints.length >= (currentQuestion.hints?.length || 3)}
              >
                <Lightbulb className="size-3.5" />
                Hint {hints.length > 0 ? `(${hints.length})` : ''}
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSubmit}
                loading={submitAnswer.isPending}
                disabled={!answer.trim()}
                className="gap-1.5"
              >
                <Send className="size-3.5" />
                Submit Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
