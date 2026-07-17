// src/pages/interview/InterviewResultsPage.tsx
//
// Replaces InterviewCompletePage.tsx
//
// FIXES vs the old page
// ─────────────────────────────────────────────────────────────────────────────
// DATA-1  Old page read score + answers from Zustand store. Store score was
//         always 0 (placeholder). Answers were lost on refresh. This page calls
//         GET /:sessionId/results for the authoritative server data.
//
// DATA-2  Store answers only had { answer, score, feedback } — no question text,
//         category, difficulty, timeSpent, hintsUsed, or skipped flag. The API
//         response has all of these; we now show them.
//
// DOM-1   <Link><Button> caused the nested-button error. Fixed by using
//         useNavigate() + plain onClick.
//
// UX-1    Added loading + error states so the page is usable on hard refresh.
//
// UX-2    Added per-question detail: time spent, hints used, skipped badge,
//         and the full feedback (not line-clamped on desktop).
//
// UX-3    resetSession() is now called once on mount.
//
// MD-1    feedback contains raw markdown (**bold**, \n\n etc).
//         Rendered with react-markdown so it displays correctly.
//
// STATS-1 When questions array is empty (DB flush race), stats show null/0.
//         Guarded with ?? 0 and hidden entirely when no questions exist.

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Trophy, RotateCcw, BarChart3, Home,
  CheckCircle, XCircle, Clock, Lightbulb,
  SkipForward, AlertTriangle, Loader2,
} from 'lucide-react'
import { useInterviewStore } from '@/store/interviewStore'
import { useSessionResults } from '@/hooks/useInterview'
import { ScoreRing } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatInterviewType, formatScore, getDifficultyBadge } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import type { QuestionResult } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMessage(score: number) {
  if (score >= 90) return { text: 'Outstanding performance! 🎉', sub: "You're interview-ready!" }
  if (score >= 75) return { text: 'Great job! 👏', sub: "A few more sessions and you'll ace it." }
  if (score >= 60) return { text: 'Good effort! 💪', sub: 'Keep practicing to improve.' }
  return { text: 'Keep going! 🔥', sub: 'Every practice session makes you better.' }
}

function formatSeconds(s: number | null): string {
  if (s == null) return '—'
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

// ── Question row ──────────────────────────────────────────────────────────────

function QuestionRow({ q, index }: { q: QuestionResult; index: number }) {
  const passed  = (q.score ?? 0) >= 60
  const skipped = q.skipped

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3 transition-colors',
      skipped
        ? 'border-border bg-secondary/20'
        : passed
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5',
    )}>
      {/* Row header */}
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-2 min-w-0'>
          {skipped ? (
            <SkipForward className='size-4 text-muted-foreground shrink-0 mt-0.5' />
          ) : passed ? (
            <CheckCircle className='size-4 text-green-400 shrink-0 mt-0.5' />
          ) : (
            <XCircle className='size-4 text-red-400 shrink-0 mt-0.5' />
          )}
          <div className='space-y-1 min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-sm font-semibold text-foreground'>
                Question {index + 1}
              </span>
              {skipped && (
                <Badge variant='outline' className='text-xs text-muted-foreground'>
                  Skipped
                </Badge>
              )}
              <Badge variant='outline' className='text-xs'>
                {q.category}
              </Badge>
              <span className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                getDifficultyBadge(q.difficulty as any),
              )}>
                {q.difficulty}
              </span>
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {q.question}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className='shrink-0 text-right'>
          <span className={cn(
            'text-lg font-bold tabular-nums',
            skipped
              ? 'text-muted-foreground'
              : passed
                ? 'text-green-400'
                : 'text-red-400',
          )}>
            {skipped ? '—' : `${q.score ?? 0}`}
            <span className='text-xs text-muted-foreground font-normal'>/100</span>
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className='flex flex-wrap gap-4 pl-6 text-xs text-muted-foreground'>
        <span className='flex items-center gap-1'>
          <Clock className='size-3' />
          {formatSeconds(q.timeSpent)}
        </span>
        {q.hintsUsed > 0 && (
          <span className='flex items-center gap-1'>
            <Lightbulb className='size-3' />
            {q.hintsUsed} hint{q.hintsUsed !== 1 ? 's' : ''} used
          </span>
        )}
      </div>

      {/* Feedback — MD-1: rendered as markdown */}
      {q.feedback && !skipped && (
        <div className='prose prose-sm prose-invert max-w-none pl-6
                        prose-p:text-foreground prose-p:leading-relaxed prose-p:my-0
                        prose-strong:text-foreground prose-li:text-foreground'>
          <ReactMarkdown>{q.feedback}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InterviewResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate      = useNavigate()
  const { resetSession } = useInterviewStore()

  // UX-3: clean up the store once on mount
  useEffect(() => {
    resetSession()
  }, [resetSession])

  // DATA-1: fetch authoritative results from the backend
  const { data: results, isLoading, isError } = useSessionResults(sessionId ?? null)

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <Loader2 className='size-8 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Loading your results…</p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !results) {
    return (
      <div className='max-w-md mx-auto mt-16 text-center space-y-4'>
        <AlertTriangle className='size-10 text-destructive mx-auto' />
        <h2 className='text-lg font-semibold text-foreground'>
          Could not load results
        </h2>
        <p className='text-sm text-muted-foreground'>
          The session may still be processing, or an error occurred.
        </p>
        <div className='flex justify-center gap-3'>
          <Button variant='outline' onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Button variant='ghost' onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ── Data — all numeric fields nullable-safe ────────────────────────────────
  const finalScore    = Math.round(results.overallScore ?? 0)
  const { text, sub } = getMessage(finalScore)

  // STATS-1: when DB flush hasn't committed, questions array may be empty.
  // Fall back to stats.totalQuestions for display counts.
  const totalQ       = results.questions.length > 0
    ? results.questions.length
    : (results.stats?.totalQuestions ?? 0)
  const passedCount  = results.questions.filter(q => !q.skipped && (q.score ?? 0) >= 60).length
  const skippedCount = results.questions.filter(q => q.skipped).length
  const failedCount  = results.questions.filter(q => !q.skipped && (q.score ?? 0) < 60).length

  // Defensive: stats fields can be null when all questions were skipped
  const avgScore = results.stats?.avgScore ?? 0
  const maxScore = results.stats?.maxScore ?? 0
  const minScore = results.stats?.minScore ?? 0

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5'>
        <CardContent className='pt-8 pb-8 text-center space-y-6'>
          {/* Score ring */}
          <div className='flex justify-center'>
            <div className='relative'>
              <ScoreRing score={finalScore} size={120} />
              {finalScore >= 75 && (
                <Trophy className='absolute -top-2 -right-2 size-6 text-yellow-400' />
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <h1 className='text-2xl font-bold text-foreground'>{text}</h1>
            <p className='text-muted-foreground mt-1'>{sub}</p>
            {results.type && (
              <p className='text-xs text-muted-foreground mt-2'>
                {formatInterviewType(results.type)} Interview
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className='flex justify-center gap-8 text-center'>
            <div>
              <p className='text-2xl font-bold text-foreground'>{totalQ}</p>
              <p className='text-xs text-muted-foreground'>Questions</p>
            </div>
            <div>
              <p className='text-2xl font-bold text-green-400'>{passedCount}</p>
              <p className='text-xs text-muted-foreground'>Passed</p>
            </div>
            <div>
              <p className='text-2xl font-bold text-red-400'>{failedCount}</p>
              <p className='text-xs text-muted-foreground'>Needs Work</p>
            </div>
            {skippedCount > 0 && (
              <div>
                <p className='text-2xl font-bold text-muted-foreground'>
                  {skippedCount}
                </p>
                <p className='text-xs text-muted-foreground'>Skipped</p>
              </div>
            )}
          </div>

          {/* Additional stats — only shown when we have question data */}
          {results.questions.length > 0 && (
            <div className='flex justify-center gap-6 text-center border-t border-border/50 pt-4'>
              <div>
                <p className='text-sm font-semibold text-foreground'>
                  {avgScore.toFixed(0)}
                </p>
                <p className='text-xs text-muted-foreground'>Avg Score</p>
              </div>
              <div>
                <p className='text-sm font-semibold text-foreground'>
                  {maxScore}
                </p>
                <p className='text-xs text-muted-foreground'>Best</p>
              </div>
              <div>
                <p className='text-sm font-semibold text-foreground'>
                  {minScore}
                </p>
                <p className='text-xs text-muted-foreground'>Lowest</p>
              </div>
            </div>
          )}

          {/* Overall feedback — MD-1: rendered as markdown */}
          {results.feedback && (
            <div className='rounded-xl border border-border bg-background/50 p-4 text-left'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
                Overall Feedback
              </p>
              <div className='prose prose-sm prose-invert max-w-none
                              prose-headings:text-foreground prose-headings:font-semibold
                              prose-p:text-foreground prose-p:leading-relaxed
                              prose-strong:text-foreground prose-strong:font-semibold
                              prose-li:text-foreground prose-ol:text-foreground
                              prose-ul:text-foreground'>
                <ReactMarkdown>{results.feedback}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* DOM-1 FIX: no <Link><Button> nesting — use onClick + navigate */}
          <div className='flex flex-wrap justify-center gap-3'>
            <Button
              variant='gradient'
              size='lg'
              className='gap-2'
              onClick={() => navigate('/interview')}
            >
              <RotateCcw className='size-4' />
              Practice Again
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='gap-2'
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className='size-4' />
              View Analytics
            </Button>
            <Button
              variant='ghost'
              size='lg'
              className='gap-2'
              onClick={() => navigate('/dashboard')}
            >
              <Home className='size-4' />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Per-question breakdown ─────────────────────────────────────────── */}
      {results.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Answer Breakdown</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {results.questions.map((q, i) => (
              <QuestionRow key={q.id} q={q} index={i} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}