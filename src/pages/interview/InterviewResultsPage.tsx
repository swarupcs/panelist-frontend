// src/pages/interview/InterviewResultsPage.tsx
//
// NEW FEATURE
// ─────────────────────────────────────────────────────────────────────────────
// FEAT-6  "Practice this topic" deep link on failed/skipped question rows.
//         Links to /interview?type=dsa&topic=CATEGORY for DSA questions,
//         or /interview?type=<sessionType> for others.
//         Also adds a "Weak Areas" quick-practice section at the bottom of the
//         results page when 2+ questions failed.

import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Trophy,
  RotateCcw,
  BarChart3,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Lightbulb,
  SkipForward,
  AlertTriangle,
  Loader2,
  Play,
  ArrowRight,
  Target,
} from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';
import { useSessionResults } from '@/hooks/useInterview';
import { ScoreRing } from '@/components/common';
import { QuestionRating } from '@/components/interview/QuestionRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  formatInterviewType,
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
  if (score >= 90)
    return {
      text: 'Outstanding performance! 🎉',
      sub: "You're interview-ready!",
    };
  if (score >= 75)
    return {
      text: 'Great job! 👏',
      sub: "A few more sessions and you'll ace it.",
    };
  if (score >= 60)
    return { text: 'Good effort! 💪', sub: 'Keep practicing to improve.' };
  return {
    text: 'Keep going! 🔥',
    sub: 'Every practice session makes you better.',
  };
}

function formatSeconds(s: number | null): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

/** Build a deep-link URL that starts a new session pre-filtered to a topic */
function practiceUrl(sessionType: string, category: string): string {
  const dsaTypes = ['dsa', 'DSA'];
  const type = dsaTypes.includes(sessionType)
    ? 'dsa'
    : sessionType.toLowerCase();
  return `/interview?type=${type}&topic=${encodeURIComponent(category)}`;
}

// ── Question row ───────────────────────────────────────────────────────────

function QuestionRow({
  q,
  index,
  sessionType,
}: {
  q: QuestionResult;
  index: number;
  sessionType: string;
}) {
  const navigate = useNavigate();
  const passed = (q.score ?? 0) >= 60;
  const skipped = q.skipped;
  const needsPractice = skipped || !passed;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 space-y-3 transition-colors',
        skipped
          ? 'border-border bg-secondary/20'
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
                <Badge
                  variant='outline'
                  className='text-xs text-muted-foreground'
                >
                  Skipped
                </Badge>
              )}
              <Badge variant='outline' className='text-xs'>
                {q.category}
              </Badge>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                  getDifficultyBadge(q.difficulty as any),
                )}
              >
                {q.difficulty}
              </span>
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {q.question}
            </p>
          </div>
        </div>

        <div className='shrink-0 text-right'>
          <span
            className={cn(
              'text-lg font-bold tabular-nums',
              skipped
                ? 'text-muted-foreground'
                : passed
                  ? 'text-green-400'
                  : 'text-red-400',
            )}
          >
            {skipped ? '—' : `${q.score ?? 0}`}
            <span className='text-xs text-muted-foreground font-normal'>
              /100
            </span>
          </span>
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
        <div
          className='prose prose-sm prose-invert max-w-none pl-6
                        prose-p:text-foreground prose-p:leading-relaxed prose-p:my-0
                        prose-strong:text-foreground prose-li:text-foreground'
        >
          <ReactMarkdown>{q.feedback}</ReactMarkdown>
        </div>
      )}

      {/* FEAT-6: Practice deep link for failed / skipped questions */}
      {needsPractice && (
        <div className='pl-6 pt-1 border-t border-border/30 flex items-center justify-between gap-3'>
          <p className='text-xs text-muted-foreground'>
            {skipped
              ? 'You skipped this.'
              : 'Score below 60 — more practice recommended.'}
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

      {/* Question rating — only for QuestionBank questions */}
      {!skipped && (
        <div className='pl-6 pt-1 border-t border-border/30'>
          <QuestionRating questionId={q.id} compact fromQuestionBank={false} />
        </div>
      )}
    </div>
  );
}

// ── Weak areas quick-practice panel ───────────────────────────────────────

function WeakAreaPanel({
  failedQuestions,
  sessionType,
}: {
  failedQuestions: QuestionResult[];
  sessionType: string;
}) {
  const navigate = useNavigate();

  // Deduplicate by category
  const categories = [...new Set(failedQuestions.map((q) => q.category))];
  if (categories.length < 2) return null; // not enough to show a panel

  return (
    <Card className='border-yellow-500/20 bg-yellow-500/5'>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Target className='size-4 text-yellow-400' />
          Recommended Practice
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <p className='text-xs text-muted-foreground mb-3'>
          You struggled with these topics. Click to start a focused session.
        </p>
        <div className='flex flex-wrap gap-2'>
          {categories.map((cat) => (
            <button
              key={cat}
              type='button'
              onClick={() => navigate(practiceUrl(sessionType, cat))}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border border-yellow-500/30',
                'bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400',
                'hover:bg-yellow-500/20 transition-colors',
              )}
            >
              {formatCategory(cat)}
              <ArrowRight className='size-3' />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InterviewResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { resetSession } = useInterviewStore();

  useEffect(() => {
    resetSession();
  }, [resetSession]);

  const {
    data: results,
    isLoading,
    isError,
  } = useSessionResults(sessionId ?? null);

  if (isLoading) {
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
    );
  }

  const finalScore = Math.round(results.overallScore ?? 0);
  const { text, sub } = getMessage(finalScore);

  const totalQ =
    results.questions.length > 0
      ? results.questions.length
      : (results.stats?.totalQuestions ?? 0);
  const passedCount = results.questions.filter(
    (q) => !q.skipped && (q.score ?? 0) >= 60,
  ).length;
  const skippedCount = results.questions.filter((q) => q.skipped).length;
  const failedCount = results.questions.filter(
    (q) => !q.skipped && (q.score ?? 0) < 60,
  ).length;
  const failedQs = results.questions.filter(
    (q) => q.skipped || (q.score ?? 0) < 60,
  );

  const avgScore = results.stats?.avgScore ?? 0;
  const maxScore = results.stats?.maxScore ?? 0;
  const minScore = results.stats?.minScore ?? 0;

  const durationSecs =
    results.endTime && results.startTime
      ? Math.round(
          (new Date(results.endTime).getTime() -
            new Date(results.startTime).getTime()) /
            1000,
        )
      : null;

  const sessionType = results.type ?? 'dsa';

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
              {results.startTime && (
                <span>{formatDate(results.startTime)}</span>
              )}
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

          {results.feedback && (
            <div className='rounded-xl border border-border bg-background/50 p-4 text-left'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
                Overall Feedback
              </p>
              <div
                className='prose prose-sm prose-invert max-w-none
                              prose-headings:text-foreground prose-headings:font-semibold
                              prose-p:text-foreground prose-p:leading-relaxed
                              prose-strong:text-foreground prose-strong:font-semibold
                              prose-li:text-foreground prose-ol:text-foreground prose-ul:text-foreground'
              >
                <ReactMarkdown>{results.feedback}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className='flex flex-wrap justify-center gap-3'>
            <Button
              variant='gradient'
              size='lg'
              className='gap-2'
              onClick={() => navigate('/interview')}
            >
              <RotateCcw className='size-4' /> Practice Again
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='gap-2'
              onClick={() => navigate(`/interview/replay/${sessionId}`)}
            >
              <Play className='size-4' /> Replay Session
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='gap-2'
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className='size-4' /> Analytics
            </Button>
            <Button
              variant='ghost'
              size='lg'
              className='gap-2'
              onClick={() => navigate('/dashboard')}
            >
              <Home className='size-4' /> Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FEAT-6: Weak areas quick-practice panel */}
      {failedQs.length >= 2 && (
        <WeakAreaPanel failedQuestions={failedQs} sessionType={sessionType} />
      )}

      {/* Per-question breakdown */}
      {results.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Answer Breakdown</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {results.questions.map((q, i) => (
              <QuestionRow
                key={q.id}
                q={q}
                index={i}
                sessionType={sessionType}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
