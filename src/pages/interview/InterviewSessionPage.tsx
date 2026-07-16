// src/pages/InterviewSessionPage.tsx
//
// FIXES
// ─────────────────────────────────────────────────────────────────────────────
// UX-1   Feedback was bleeding into the next question on the same page.
//        Industry standard (Pramp / Interviewing.io style): after submitting,
//        show a full feedback interstitial. The next question only renders
//        after the user explicitly clicks "Next Question".
//
// UX-2   Session completion now shows an inline modal with the final score
//        and a "View Full Results" CTA before navigating to /results.
//
// DOM-1  `loading` boolean was spreading onto the native <button> element via
//        shadcn's Button (which forwards all props to the DOM). Fixed by never
//        passing `loading` to Button — use `disabled` + a manual Loader2 spinner.
//
// DOM-2  Nested <button> error — pause/skip/end controls are now plain <button>
//        elements styled with Tailwind, never wrapped inside a shadcn Button.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Send,
  Pause,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  XCircle,
  ChevronRight,
  Trophy,
  Loader2,
} from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';
import {
  useSubmitAnswer,
  useRequestHint,
  usePauseSession,
  useResumeSession,
  useSkipQuestion,
  useEndInterview,
} from '@/hooks/useInterview';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/common';
import { getDifficultyBadge, formatScore } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

// ── Types ─────────────────────────────────────────────────────────────────────

type PagePhase =
  | 'answering' // question + textarea visible
  | 'feedback' // interstitial: score + feedback + "Next Question" button
  | 'completed'; // modal: final score + "View Full Results" button

interface FeedbackState {
  score: number;
  feedback: string;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-400'
      : score >= 60
        ? 'text-yellow-400'
        : 'text-red-400';
  return (
    <div className={cn('text-5xl font-bold tabular-nums', color)}>
      {score}
      <span className='text-2xl text-muted-foreground'>/100</span>
    </div>
  );
}

// DOM-2 FIX: plain <button> with Tailwind — never inside a shadcn Button
function IconButton({
  onClick,
  disabled = false,
  title,
  loading = false,
  children,
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1.5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50',
        className,
      )}
    >
      {loading ? <Loader2 className='size-4 animate-spin' /> : children}
    </button>
  );
}

// DOM-2 FIX: plain text button for hint/skip — not a shadcn Button
function TextButton({
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50',
        className,
      )}
    >
      {loading && <Loader2 className='size-3.5 animate-spin' />}
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<PagePhase>('answering');
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackState | null>(
    null,
  );
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isPaused,
    isCompleted,
  } = useInterviewStore();

  const submitAnswer = useSubmitAnswer();
  const requestHint = useRequestHint(sessionId!);
  const pauseSession = usePauseSession();
  const resumeSession = useResumeSession();
  const skipQuestion = useSkipQuestion();
  const endInterview = useEndInterview();

  // Timer — only ticks while answering and not paused
  useEffect(() => {
    if (phase !== 'answering' || isPaused || isCompleted) return;
    const id = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, isPaused, isCompleted]);

  // Store can flip isCompleted (e.g. via skip on last question without feedback)
  useEffect(() => {
    if (isCompleted && phase !== 'completed') {
      setPhase('completed');
    }
  }, [isCompleted, phase]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!answer.trim() || !sessionId) return;
    submitAnswer.mutate(
      { sessionId, answer: answer.trim(), timeSpent },
      {
        onSuccess: (data) => {
          setPendingFeedback({ score: data.score, feedback: data.feedback });
          // UX-1: always go to feedback interstitial first
          setPhase(data.sessionCompleted ? 'completed' : 'feedback');
        },
      },
    );
  };

  // UX-1: user explicitly advances from feedback → next question
  const handleNextQuestion = () => {
    setAnswer('');
    setHints([]);
    setShowHints(false);
    setTimeSpent(0);
    setPendingFeedback(null);
    setPhase('answering');
  };

  const handleHint = () => {
    if (!sessionId) return;
    requestHint.mutate(undefined, {
      onSuccess: (data) => {
        setHints((h) => [...h, data.hint]);
        setShowHints(true);
      },
    });
  };

  const handlePauseResume = () => {
    if (!sessionId) return;
    isPaused ? resumeSession.mutate(sessionId) : pauseSession.mutate(sessionId);
  };

  const handleSkip = () => {
    if (!sessionId) return;
    skipQuestion.mutate(sessionId, {
      onSuccess: (data) => {
        // Skip: no feedback interstitial, move straight to next question
        setAnswer('');
        setHints([]);
        setShowHints(false);
        setTimeSpent(0);
        if (data.sessionCompleted) setPhase('completed');
      },
    });
  };

  const handleEnd = () => {
    if (!sessionId) return;
    endInterview.mutate(sessionId);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!currentQuestion && phase === 'answering' && !isCompleted) {
    return <LoadingScreen message='Loading question...' />;
  }

  const progress =
    totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const hintsExhausted = hints.length >= (currentQuestion?.hints?.length ?? 0);
  const isSubmitting = submitAnswer.isPending;
  const isPauseLoading = pauseSession.isPending || resumeSession.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className='max-w-3xl mx-auto space-y-4 animate-fade-in'>
      {/* ── Header bar ── always visible ──────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <Progress value={progress} className='w-32 h-1.5' />
        </div>

        <div className='flex items-center gap-2'>
          {/* Timer */}
          <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
            <Clock className='size-3.5' />
            <span
              className={cn(
                timeSpent > 300 && 'text-yellow-400',
                timeSpent > 600 && 'text-red-400',
              )}
            >
              {formatTime(timeSpent)}
            </span>
          </div>

          {/* DOM-1 + DOM-2 FIX: plain <button>, no `loading` prop on shadcn Button */}
          <IconButton
            onClick={handlePauseResume}
            disabled={phase === 'feedback'}
            loading={isPauseLoading}
            title={isPaused ? 'Resume' : 'Pause'}
            className='text-muted-foreground hover:bg-secondary hover:text-foreground'
          >
            {isPaused ? (
              <Play className='size-4' />
            ) : (
              <Pause className='size-4' />
            )}
          </IconButton>

          {!showEndConfirm ? (
            <IconButton
              onClick={() => setShowEndConfirm(true)}
              title='End session'
              className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
            >
              <XCircle className='size-4' />
            </IconButton>
          ) : (
            <div className='flex items-center gap-1.5'>
              <span className='text-xs text-muted-foreground'>End?</span>
              <button
                type='button'
                onClick={handleEnd}
                disabled={endInterview.isPending}
                className='rounded px-2 py-0.5 text-xs font-medium bg-destructive
                           text-destructive-foreground hover:bg-destructive/90
                           disabled:opacity-50 transition-colors'
              >
                {endInterview.isPending ? 'Ending…' : 'Yes'}
              </button>
              <button
                type='button'
                onClick={() => setShowEndConfirm(false)}
                className='rounded px-2 py-0.5 text-xs font-medium
                           text-muted-foreground hover:text-foreground
                           hover:bg-secondary transition-colors'
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paused banner */}
      {isPaused && (
        <div
          className='rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4
                        text-center text-sm text-yellow-400'
        >
          Session paused — click play to continue.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE: answering
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === 'answering' && currentQuestion && (
        <>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>{currentQuestion.category}</Badge>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    getDifficultyBadge(currentQuestion.difficulty),
                  )}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-foreground leading-relaxed whitespace-pre-wrap'>
                {currentQuestion.question}
              </p>
            </CardContent>
          </Card>

          {hints.length > 0 && showHints && (
            <Card className='border-primary/20 bg-primary/5'>
              <CardContent className='pt-4'>
                <p className='text-xs font-semibold text-primary mb-2 flex items-center gap-1'>
                  <Lightbulb className='size-3' /> Hints
                </p>
                <ul className='space-y-2'>
                  {hints.map((hint, i) => (
                    <li key={i} className='text-sm text-foreground flex gap-2'>
                      <span className='text-primary shrink-0'>{i + 1}.</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {!isPaused && (
            <Card>
              <CardContent className='pt-4 space-y-3'>
                <Textarea
                  placeholder='Type your answer here... For code, use plain text or specify the language.'
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className='min-h-[180px] font-mono text-sm resize-y'
                  disabled={isSubmitting}
                />
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-1'>
                    {/* DOM-1 + DOM-2 FIX: plain TextButton, no shadcn nesting */}
                    <TextButton
                      onClick={handleHint}
                      loading={requestHint.isPending}
                      disabled={hintsExhausted}
                      className='text-muted-foreground hover:text-primary hover:bg-secondary'
                    >
                      {!requestHint.isPending && (
                        <Lightbulb className='size-3.5' />
                      )}
                      Hint{hints.length > 0 ? ` (${hints.length})` : ''}
                    </TextButton>

                    <TextButton
                      onClick={handleSkip}
                      loading={skipQuestion.isPending}
                      className='text-muted-foreground hover:text-yellow-400 hover:bg-secondary'
                    >
                      {!skipQuestion.isPending && (
                        <SkipForward className='size-3.5' />
                      )}
                      Skip
                    </TextButton>
                  </div>

                  {/* shadcn Button is safe here — it is not nested inside another button */}
                  <Button
                    variant='gradient'
                    size='sm'
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className='gap-1.5'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='size-3.5 animate-spin' />{' '}
                        Evaluating…
                      </>
                    ) : (
                      <>
                        <Send className='size-3.5' /> Submit Answer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE: feedback  (UX-1 interstitial)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === 'feedback' && pendingFeedback && currentQuestion && (
        <div className='space-y-4 animate-fade-in'>
          {/* Previous question — dimmed, read-only */}
          <Card className='opacity-60'>
            <CardHeader className='pb-3'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>{currentQuestion.category}</Badge>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    getDifficultyBadge(currentQuestion.difficulty),
                  )}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm'>
                {currentQuestion.question}
              </p>
            </CardContent>
          </Card>

          {/* Feedback card */}
          <Card
            className={cn(
              'border-2',
              pendingFeedback.score >= 80
                ? 'border-green-500/40 bg-green-500/5'
                : pendingFeedback.score >= 60
                  ? 'border-yellow-500/40 bg-yellow-500/5'
                  : 'border-red-500/40 bg-red-500/5',
            )}
          >
            <CardContent className='pt-6 space-y-5'>
              <div className='flex items-center gap-4'>
                {pendingFeedback.score >= 70 ? (
                  <CheckCircle2 className='size-8 text-green-400 shrink-0' />
                ) : (
                  <AlertCircle className='size-8 text-yellow-400 shrink-0' />
                )}
                <div>
                  <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1'>
                    Your Score
                  </p>
                  <ScoreRing score={pendingFeedback.score} />
                </div>
              </div>

              <div>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                  Feedback
                </p>
                <p className='text-sm text-foreground leading-relaxed'>
                  {pendingFeedback.feedback}
                </p>
              </div>

              <div className='flex justify-end pt-1'>
                <Button
                  variant='gradient'
                  size='sm'
                  onClick={handleNextQuestion}
                  className='gap-1.5'
                >
                  Next Question
                  <ChevronRight className='size-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE: completed  (UX-2 modal)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === 'completed' && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center
                        bg-background/80 backdrop-blur-sm animate-fade-in'
        >
          <Card className='w-full max-w-md mx-4 border-primary/30'>
            <CardContent className='pt-8 pb-6 space-y-6 text-center'>
              <div className='flex justify-center'>
                <div className='rounded-full bg-primary/10 p-4'>
                  <Trophy className='size-10 text-primary' />
                </div>
              </div>

              <div className='space-y-1'>
                <h2 className='text-xl font-bold text-foreground'>
                  Session Complete!
                </h2>
                <p className='text-sm text-muted-foreground'>
                  You answered all {totalQuestions} question
                  {totalQuestions !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Last question's feedback preview */}
              {pendingFeedback && (
                <div className='rounded-xl border border-border bg-secondary/30 p-4 text-left space-y-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      Last Answer
                    </p>
                    <ScoreRing score={pendingFeedback.score} />
                  </div>
                  <p className='text-sm text-foreground leading-relaxed line-clamp-3'>
                    {pendingFeedback.feedback}
                  </p>
                </div>
              )}

              <p className='text-sm text-muted-foreground'>
                View the full breakdown with per-question scores, time spent,
                and improvement suggestions.
              </p>

              <Button
                variant='gradient'
                size='lg'
                onClick={() => navigate(`/interview/results/${sessionId}`)}
                className='w-full gap-2'
              >
                View Full Results
                <ChevronRight className='size-4' />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
