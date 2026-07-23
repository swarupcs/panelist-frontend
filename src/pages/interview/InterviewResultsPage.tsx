// src/pages/interview/InterviewResultsPage.tsx
//
// RESULTS-FIX: Backend persistSession() is fire-and-forget, so question rows
// (score, userAnswer, feedback) may be null in the DB when the client calls
// /results immediately after completion. The overallScore at the session level
// IS correct (computed before DB write). This fix:
//   1. Uses overallScore for the hero ring — always correct
//   2. Detects whether question-level scores are populated
//   3. Shows "Evaluating…" placeholder rows when scores are null
//   4. Falls back to overallScore for stat chips when per-question stats are 0

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { InterviewReportPanel } from '@/components/interview/InterviewReportPanel';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Home,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  Share2,
  SkipForward,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetSession } from '@/store/interviewSlice';
import { useStudyPlan, useStartInterview } from '@/hooks/useInterview';
import { interviewApi } from '@/api/interview.api';
import { ScoreRing } from '@/components/common';
import { QuestionRating } from '@/components/interview/QuestionRating';
import { ShareScorecardModal } from '@/components/interview/ShareScorecardModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  formatInterviewType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatScore,
  getDifficultyBadge,
  formatDate,
  formatDuration,
  formatCategory,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { QuestionResult } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function getMessage(score: number) {
  if (score >= 90) return { text: 'Outstanding performance! 🎉', sub: "You're interview-ready!" };
  if (score >= 75) return { text: 'Great job! 👏', sub: "A few more sessions and you'll ace it." };
  if (score >= 60) return { text: 'Good effort! 💪', sub: 'Keep practicing to improve.' };
  return { text: 'Keep going! 🔥', sub: 'Every practice session makes you better.' };
}

function formatSeconds(s: number | null): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function practiceUrl(sessionType: string, category: string): string {
  const type = sessionType === 'dsa' || sessionType === 'DSA' ? 'dsa' : sessionType.toLowerCase();
  return `/interview?type=${type}&topic=${encodeURIComponent(category)}`;
}

// ── Question row ───────────────────────────────────────────────────────────

function QuestionRow({
  q,
  index,
  sessionType,
  scoresPending,
  dataMissing = false,
}: {
  q: QuestionResult;
  index: number;
  sessionType: string;
  scoresPending: boolean;
  dataMissing?: boolean;
}) {
  const navigate = useNavigate();

  // score===null + userAnswer===null  → answer not persisted (cache lost) OR truly unanswered
  // score===null + userAnswer!==null  → answer submitted, DB flush pending
  const hasScoredData = q.score !== null;
  const neverAnswered = q.score === null && q.userAnswer === null && !q.skipped && !scoresPending;
  const passed = hasScoredData && (q.score ?? 0) >= 60;
  const skipped = q.skipped;
  const needsPractice = hasScoredData && (skipped || !passed);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 space-y-3 transition-colors',
        skipped
          ? 'border-border bg-secondary/20'
          : !hasScoredData
            ? 'border-border bg-secondary/10'
            : passed
              ? 'border-green-500/20 bg-green-500/5'
              : 'border-red-500/20 bg-red-500/5',
      )}
    >
      {/* Header */}
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-2 min-w-0'>
          {skipped ? (
            <SkipForward className='size-4 text-muted-foreground shrink-0 mt-0.5' />
          ) : !hasScoredData ? (
            <HelpCircle className='size-4 text-muted-foreground shrink-0 mt-0.5' />
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
              {!hasScoredData && !skipped && scoresPending && (
                <Badge variant='outline' className='text-xs text-yellow-400 border-yellow-500/30'>
                  Evaluating…
                </Badge>
              )}
              {neverAnswered && !scoresPending && !dataMissing && (
                <Badge variant='outline' className='text-xs text-muted-foreground border-border'>
                  Not answered
                </Badge>
              )}
              {dataMissing && !hasScoredData && !skipped && (
                <Badge variant='outline' className='text-xs text-muted-foreground border-border'>
                  Details unavailable
                </Badge>
              )}
              <Badge variant='outline' className='text-xs'>
                {q.category}
              </Badge>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  getDifficultyBadge(q.difficulty as any),
                )}
              >
                {q.difficulty}
              </span>
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed'>{q.question}</p>
          </div>
        </div>

        <div className='shrink-0 text-right'>
          {hasScoredData ? (
            <span
              className={cn(
                'text-lg font-bold tabular-nums',
                skipped ? 'text-muted-foreground' : passed ? 'text-green-400' : 'text-red-400',
              )}
            >
              {skipped ? '—' : `${q.score ?? 0}`}
              <span className='text-xs text-muted-foreground font-normal'>/100</span>
            </span>
          ) : scoresPending ? (
            <span className='text-xs text-yellow-400'>Evaluating…</span>
          ) : dataMissing ? (
            <span className='text-xs text-muted-foreground'>—</span>
          ) : (
            <span className='text-xs text-muted-foreground'>—</span>
          )}
          {q.communicationScore != null && (
            <div className='mt-1 text-[10px] text-muted-foreground flex justify-end gap-1 items-center'>
              <span title="Communication Score" className='font-semibold text-primary'>{q.communicationScore}</span>
              <span>Comm</span>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
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

      {/* Feedback */}
      {q.feedback && !skipped && (
        <div className='prose prose-sm prose-invert max-w-none pl-6 prose-p:text-foreground prose-p:leading-relaxed prose-p:my-0 prose-strong:text-foreground prose-li:text-foreground'>
          <ReactMarkdown>{q.feedback}</ReactMarkdown>
        </div>
      )}

      {/* Side-by-side Answer Comparison */}
      {hasScoredData && !skipped && (q.userAnswer || q.idealSolution) && (
        <div className='pl-6 mt-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/50 rounded-lg overflow-hidden bg-secondary/5'>
            {/* User Answer */}
            <div className='flex flex-col border-r border-border/50'>
              <div className='bg-muted/50 px-3 py-2 border-b border-border/50 text-xs font-semibold text-muted-foreground flex items-center gap-2'>
                <CheckCircle className='size-3' /> Your Answer
              </div>
              <div className='p-3 prose prose-sm prose-invert max-w-none flex-1 overflow-auto max-h-[300px]'>
                {q.userAnswer ? (
                  <ReactMarkdown>{q.userAnswer}</ReactMarkdown>
                ) : (
                  <span className='italic text-muted-foreground'>No answer provided</span>
                )}
              </div>
            </div>

            {/* Ideal Solution */}
            <div className='flex flex-col'>
              <div className='bg-primary/10 px-3 py-2 border-b border-border/50 text-xs font-semibold text-primary flex items-center gap-2'>
                <Target className='size-3' /> Ideal Solution
              </div>
              <div className='p-3 prose prose-sm prose-invert max-w-none flex-1 overflow-auto max-h-[300px]'>
                {q.idealSolution ? (
                  <ReactMarkdown>{q.idealSolution}</ReactMarkdown>
                ) : (
                  <span className='italic text-muted-foreground'>No ideal solution available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No answer recorded — question was skipped or session ended early */}
      {neverAnswered && !scoresPending && !dataMissing && (
        <p className='pl-6 text-xs text-muted-foreground italic'>
          No answer was submitted for this question.
        </p>
      )}

      {/* Practice deep link */}
      {needsPractice && (
        <div className='pl-6 pt-1 border-t border-border/30 flex items-center justify-between gap-3'>
          <p className='text-xs text-muted-foreground'>
            {skipped ? 'You skipped this.' : 'Score below 60 — more practice recommended.'}
          </p>
          <button
            type='button'
            onClick={() => navigate(practiceUrl(sessionType, q.category))}
            className={cn(
              'flex items-center gap-1 rounded-md border border-border px-2.5 py-1',
              'text-xs font-medium text-muted-foreground transition-colors',
              'hover:bg-secondary hover:text-foreground whitespace-nowrap',
            )}
          >
            <Target className='size-3 text-primary' />
            Practice {formatCategory(q.category)}
            <ArrowRight className='size-3' />
          </button>
        </div>
      )}

      {/* Question rating */}
      {hasScoredData && !skipped && (
        <div className='pl-6 pt-1 border-t border-border/30'>
          <QuestionRating questionId={q.id} compact fromQuestionBank={false} />
        </div>
      )}
    </div>
  );
}

// ── Study plan panel — closes the learning loop ─────────────────────────────
//
// Turns the finished interview into next actions: the topics to focus on, a
// one-click focused practice session covering all of them, the report's
// concrete suggestions, and any spaced-repetition reviews now due.

function StudyPlanPanel({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const { data: plan } = useStudyPlan(sessionId);
  const startInterview = useStartInterview();

  if (!plan) return null;

  const hasWeak = plan.weakCategories.length > 0;
  const hasSuggestions = plan.suggestions.length > 0;
  const due = plan.spacedRepetition.dueForReview;
  if (!hasWeak && !hasSuggestions && due === 0) return null;

  const startPractice = () => {
    if (!plan.recommendedPractice) return;
    startInterview.mutate({
      type: plan.recommendedPractice.type,
      difficulty: plan.recommendedPractice.difficulty,
      focusAreas: plan.recommendedPractice.focusAreas,
    });
  };

  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Target className='size-4 text-primary' />
          Your next steps
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {hasWeak && (
          <div className='space-y-2'>
            <p className='text-xs text-muted-foreground'>
              Focus areas from this interview
            </p>
            <div className='flex flex-wrap gap-2'>
              {plan.weakCategories.map((c) => (
                <span
                  key={c.category}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-500'
                >
                  {formatCategory(c.category)}
                  {c.avgScore != null && (
                    <span className='tabular-nums opacity-70'>{c.avgScore}</span>
                  )}
                </span>
              ))}
            </div>
            <div className='flex flex-wrap gap-2'>
              {plan.recommendedPractice && (
                <Button
                  size='sm'
                  className='gap-2'
                  disabled={startInterview.isPending}
                  onClick={startPractice}
                >
                  {startInterview.isPending ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Play className='size-3.5' />
                  )}
                  Practice these weak areas
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                className='gap-2'
                onClick={() =>
                  navigate(
                    `/learning?weaknesses=${encodeURIComponent(
                      plan.weakCategories.map((c) => formatCategory(c.category)).join(', '),
                    )}`,
                  )
                }
              >
                <BookOpen className='size-3.5' />
                Build a study path
              </Button>
            </div>
          </div>
        )}

        {hasSuggestions && (
          <div className='space-y-1.5'>
            <p className='text-xs text-muted-foreground flex items-center gap-1'>
              <Lightbulb className='size-3.5 text-amber-400' />
              What to practise next
            </p>
            <ul className='space-y-1'>
              {plan.suggestions.slice(0, 6).map((s, i) => (
                <li key={i} className='flex gap-2 text-sm text-foreground'>
                  <CheckCircle className='size-3.5 text-primary shrink-0 mt-0.5' />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {due > 0 && (
          <div className='flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2'>
            <span className='text-sm text-muted-foreground'>
              <span className='font-semibold text-foreground'>{due}</span> review
              {due === 1 ? '' : 's'} due from spaced repetition
            </span>
            <Button
              size='sm'
              variant='outline'
              className='gap-1.5'
              onClick={() => navigate('/interview?type=srs_review')}
            >
              <RotateCcw className='size-3.5' />
              Review now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Pacing panel — how time was spent across questions ──────────────────────

function PacingPanel({ questions }: { questions: QuestionResult[] }) {
  const timed = questions
    .map((q, i) => ({ ...q, index: i }))
    .filter((q) => q.timeSpent != null && q.timeSpent > 0);

  // Needs at least two timed questions for a distribution to mean anything.
  if (timed.length < 2) return null;

  const total = timed.reduce((sum, q) => sum + (q.timeSpent ?? 0), 0);
  if (total <= 0) return null;

  const avg = Math.round(total / timed.length);
  const slowest = timed.reduce((a, b) => ((b.timeSpent ?? 0) > (a.timeSpent ?? 0) ? b : a));
  const max = slowest.timeSpent ?? 1;
  const slowestShare = Math.round(((slowest.timeSpent ?? 0) / total) * 100);
  // Questions that were left unanswered / timed out — a pacing signal too.
  const ranOut = questions.filter((q) => q.skipped || q.timeSpent === 0);

  const insights: string[] = [];
  if (slowestShare >= 40) {
    insights.push(
      `You spent ${slowestShare}% of your time on Q${slowest.index + 1} (${formatCategory(slowest.category)}).`,
    );
  }
  if (ranOut.length > 0) {
    insights.push(
      `${ranOut.length} question${ranOut.length === 1 ? '' : 's'} went unanswered or ran out of time.`,
    );
  }
  insights.push(`Average ${formatSeconds(avg)} per answered question.`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Clock className='size-4 text-primary' />
          Pacing
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='space-y-1.5'>
          {timed.map((q) => {
            const pct = Math.round(((q.timeSpent ?? 0) / max) * 100);
            const isSlow = q.id === slowest.id;
            return (
              <div key={q.id} className='flex items-center gap-2'>
                <span className='w-8 shrink-0 text-xs text-muted-foreground tabular-nums'>
                  Q{q.index + 1}
                </span>
                <div className='flex-1 h-4 rounded bg-muted/40 overflow-hidden'>
                  <div
                    className={cn(
                      'h-full rounded transition-all',
                      isSlow ? 'bg-yellow-500/70' : 'bg-primary/60',
                    )}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <span className='w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums'>
                  {formatSeconds(q.timeSpent)}
                </span>
              </div>
            );
          })}
        </div>
        <ul className='space-y-1 border-t border-border/40 pt-2'>
          {insights.map((s, i) => (
            <li key={i} className='text-xs text-muted-foreground'>
              • {s}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InterviewResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(resetSession());
  }, [dispatch]);

  // Fetch results. If question scores are null but overallScore > 0 (answers were
  // submitted), retry up to 3 times at 2 s intervals — the backend persistSession()
  // is fire-and-forget so the DB write may lag slightly.
  // After 3 attempts we treat null scores as a permanent miss (cache expired) and
  // show overallScore only, without misleading "pending" UI.
  const MAX_POLLS = 3;
  const [pollCount, setPollCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: ['interview', 'results', sessionId],
    queryFn: () => interviewApi.getResults(sessionId!),
    enabled: !!sessionId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!results) return;
    const hasScores = results.questions.some((q) => q.score !== null);
    // Stop when scores arrived, polling limit hit, or no answers were submitted
    if (hasScores || pollCount >= MAX_POLLS || (results.overallScore ?? 0) === 0) return;
    const t = setTimeout(() => {
      setPollCount((c) => c + 1);
      refetch();
    }, 2000);
    return () => clearTimeout(t);
  }, [results, pollCount, refetch]);

  if (isLoading && !results) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <Loader2 className='size-8 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Loading your results…</p>
      </div>
    );
  }

  if (isError || !results) {
    return (
      <div className='max-w-md mx-auto mt-16 text-center space-y-4'>
        <AlertTriangle className='size-10 text-destructive mx-auto' />
        <h2 className='text-lg font-semibold text-foreground'>Could not load results</h2>
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
    );
  }

  // ── RESULTS-FIX: derive display values safely ──────────────────────────

  // overallScore at the session level is always correctly computed by the backend
  const finalScore = Math.round(results.overallScore ?? 0);
  const { text, sub } = getMessage(finalScore);

  // Detect if per-question scores are populated yet
  const hasQuestionScores = results.questions.some((q) => q.score !== null);
  // "Pending flush" = answer submitted but score not yet written (fire-and-forget race)
  // "Never answered" = userAnswer is also null (session ended/abandoned without submitting)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasPendingFlush = results.questions.some(
    (q) => q.userAnswer !== null && q.score === null,
  );
  // stillPolling = we're in the 3-attempt retry window
  const stillPolling = pollCount < MAX_POLLS && !hasQuestionScores && (results.overallScore ?? 0) > 0;
  // permanentMiss = retries exhausted, score still null — backend lost the write
  const dataPermanentlyMissing = pollCount >= MAX_POLLS && !hasQuestionScores && (results.overallScore ?? 0) > 0;
  const scoresPending = stillPolling;

  const totalQ = results.questions.length > 0
    ? results.questions.length
    : (results.stats?.totalQuestions ?? 0);

  // Only compute pass/fail counts when we have actual scores
  const passedCount = hasQuestionScores
    ? results.questions.filter((q) => !q.skipped && (q.score ?? 0) >= 60).length
    : null;
  const skippedCount = results.questions.filter((q) => q.skipped).length;
  const failedCount = hasQuestionScores
    ? results.questions.filter((q) => !q.skipped && (q.score ?? 0) < 60).length
    : null;
  // Stats: if per-question stats are all 0 but overallScore exists, use overallScore
  const statsAreEmpty =
    (results.stats?.avgScore ?? 0) === 0 &&
    (results.stats?.maxScore ?? 0) === 0 &&
    (results.stats?.minScore ?? 0) === 0;

  // When stats are zeroed and we have overallScore, use overallScore as fallback
  const displayAvg = statsAreEmpty && finalScore > 0 ? finalScore : (results.stats?.avgScore ?? 0);
  const displayMax = statsAreEmpty && finalScore > 0 ? finalScore : (results.stats?.maxScore ?? 0);
  const displayMin = statsAreEmpty && finalScore > 0 ? finalScore : (results.stats?.minScore ?? 0);

  const commScores = results.questions.map(q => q.communicationScore).filter((s): s is number => s != null && s > 0);
  const displayCommScore = commScores.length > 0 ? Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length) : null;

  // For pass/fail hero counts — permanentMiss means we trust overallScore >= 60 = passed
  const sessionPassed = finalScore >= 60;

  const durationSecs =
    results.endTime && results.startTime
      ? Math.round(
          (new Date(results.endTime).getTime() - new Date(results.startTime).getTime()) / 1000,
        )
      : null;

  const sessionType = results.type ?? 'dsa';

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>
      {/* Hero card */}
      <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5'>
        <CardContent className='pt-8 pb-8 text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='relative'>
              <ScoreRing score={finalScore} size={120} />
              {finalScore >= 75 && (
                <Trophy className='absolute -top-2 -right-2 size-6 text-yellow-400' />
              )}
            </div>
          </div>

          <div>
            <h1 className='text-2xl font-bold text-foreground'>{text}</h1>
            <p className='text-muted-foreground mt-1'>{sub}</p>
            {results.type && (
              <p className='text-xs text-muted-foreground mt-1'>
                {formatInterviewType(results.type)} Interview
              </p>
            )}
            <div className='flex justify-center gap-4 mt-2 text-xs text-muted-foreground'>
              {results.startTime && <span>{formatDate(results.startTime)}</span>}
              {durationSecs != null && (
                <span>Duration: {formatDuration(durationSecs)}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className='flex justify-center gap-8 text-center'>
            <div>
              <p className='text-2xl font-bold text-foreground'>{totalQ}</p>
              <p className='text-xs text-muted-foreground'>Questions</p>
            </div>
            {passedCount !== null && !dataPermanentlyMissing ? (
              <>
                <div>
                  <p className='text-2xl font-bold text-green-400'>{passedCount}</p>
                  <p className='text-xs text-muted-foreground'>Passed</p>
                </div>
                <div>
                  <p className='text-2xl font-bold text-red-400'>{failedCount}</p>
                  <p className='text-xs text-muted-foreground'>Needs Work</p>
                </div>
              </>
            ) : (
              <div>
                <p className={cn(
                  'text-2xl font-bold',
                  sessionPassed ? 'text-green-400' : 'text-red-400',
                )}>
                  {sessionPassed ? '✓' : '✗'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {sessionPassed ? 'Passed' : 'Needs Work'}
                </p>
              </div>
            )}
            {skippedCount > 0 && (
              <div>
                <p className='text-2xl font-bold text-muted-foreground'>{skippedCount}</p>
                <p className='text-xs text-muted-foreground'>Skipped</p>
              </div>
            )}
          </div>

          {/* Score breakdown — only show when we have valid numbers */}
          {(hasQuestionScores || statsAreEmpty) && totalQ > 0 && (
            <div className='flex justify-center gap-6 text-center border-t border-border/50 pt-4'>
              <div>
                <p className='text-sm font-semibold text-foreground'>{displayAvg.toFixed(0)}</p>
                <p className='text-xs text-muted-foreground'>Avg Score</p>
              </div>
              <div>
                <p className='text-sm font-semibold text-foreground'>{displayMax}</p>
                <p className='text-xs text-muted-foreground'>Best</p>
              </div>
              <div>
                <p className='text-sm font-semibold text-foreground'>{displayMin}</p>
                <p className='text-xs text-muted-foreground'>Lowest</p>
              </div>
              {displayCommScore != null && (
                <div>
                  <p className='text-sm font-semibold text-primary'>{displayCommScore.toFixed(0)}</p>
                  <p className='text-xs text-muted-foreground'>Comm</p>
                </div>
              )}
            </div>
          )}

          {/* Overall feedback */}
          {results.feedback && (
            <div className='rounded-xl border border-border bg-background/50 p-4 text-left'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
                Overall Feedback
              </p>
              <div className='prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold prose-li:text-foreground prose-ol:text-foreground prose-ul:text-foreground'>
                <ReactMarkdown>{results.feedback}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className='flex flex-wrap justify-center gap-3 print:hidden'>
            <Button variant='gradient' size='lg' className='gap-2' onClick={() => navigate('/interview')}>
              <RotateCcw className='size-4' /> Practice Again
            </Button>
            <Button variant='outline' size='lg' className='gap-2' onClick={() => navigate(`/interview/replay/${sessionId}`)}>
              <Play className='size-4' /> Replay
            </Button>
            <Button variant='outline' size='lg' className='gap-2' onClick={() => setShowShareModal(true)}>
              <Share2 className='size-4' /> Share
            </Button>
            <Button variant='outline' size='lg' className='gap-2' onClick={() => window.print()}>
              <FileText className='size-4' /> PDF
            </Button>
            <Button variant='outline' size='lg' className='gap-2' onClick={() => window.location.href = `/api/share/${sessionId}/export/csv`}>
              <Download className='size-4' /> CSV
            </Button>
            <Button variant='outline' size='lg' className='gap-2' onClick={() => navigate('/analytics')}>
              <BarChart3 className='size-4' /> Analytics
            </Button>
            <Button variant='ghost' size='lg' className='gap-2' onClick={() => navigate('/dashboard')}>
              <Home className='size-4' /> Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* The end-of-session report: rating, rubric and what to practise next.
          Placed above the per-question breakdown because it is the judgement
          on the session as a whole, and the breakdown is the detail behind it. */}
      {sessionId && <InterviewReportPanel sessionId={sessionId} />}

      {/* The same session, framed as a hiring decision. */}
      {sessionId && (
        <Link to={`/recruiter/sessions/${sessionId}`} className='block'>
          <Card className='transition hover:border-primary/40'>
            <CardContent className='flex items-center justify-between gap-3 py-4'>
              <div className='flex items-center gap-3'>
                <Briefcase className='size-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>See the recruiter&rsquo;s view</p>
                  <p className='text-xs text-muted-foreground'>
                    The same session, framed as a hiring decision
                  </p>
                </div>
              </div>
              <span className='text-xs text-muted-foreground'>Open →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Study plan — closes the loop from this interview into next actions */}
      {sessionId && <StudyPlanPanel sessionId={sessionId} />}

      {/* Pacing — time distribution across questions */}
      <PacingPanel questions={results.questions} />

      {/* Per-question breakdown */}
      {results.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              Answer Breakdown
              {stillPolling && (
                <span className='text-xs text-primary font-normal flex items-center gap-1'>
                  <Loader2 className='size-3 animate-spin' />
                  Fetching scores…
                </span>
              )}
              {dataPermanentlyMissing && (
                <span className='text-xs text-muted-foreground font-normal'>
                  detailed breakdown unavailable
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {results.questions.map((q, i) => (
              <QuestionRow
                key={q.id}
                q={q}
                index={i}
                sessionType={sessionType}
                scoresPending={scoresPending}
                dataMissing={dataPermanentlyMissing}
              />
            ))}
            {/* Suggest refresh only when answer was submitted but score pending DB flush */}
            {stillPolling && (
              <div className='flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3'>
                <Loader2 className='size-4 animate-spin text-primary shrink-0' />
                <p className='text-xs text-primary'>
                  Fetching per-question scores… ({pollCount}/{MAX_POLLS})
                </p>
              </div>
            )}
            {dataPermanentlyMissing && (
              <div className='rounded-lg border border-border bg-secondary/30 px-4 py-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Your answer was submitted and your overall score of <span className='text-foreground font-semibold'>{finalScore}/100</span> is recorded. Per-question details couldn't be saved — this is a known issue being fixed. Try starting a new session to see full breakdowns.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ShareScorecardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        sessionId={sessionId!}
      />
    </div>
  );
}