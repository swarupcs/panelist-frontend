// src/pages/interview/InterviewSessionPage.tsx
//
// NEW FEATURES (on top of existing)
// ─────────────────────────────────────────────────────────────────────────────
// FEAT-4  Keyboard shortcuts
//           Ctrl+Enter  → submit current answer (text tab)
//           H           → request a hint
//           P           → pause / resume session
//           Escape      → dismiss end-confirm if open
//         A small overlay badge shows active shortcuts.
//
// FEAT-5  Auto-submit on timer expiry
//         When SessionTimer fires isExpired=true the current answer is
//         automatically submitted (or "[TIME_EXPIRED]" if empty). A toast-style
//         banner explains what happened.
//
// FEAT-6  isTimed + adaptiveMode flags read from sessionStorage
//         (written by InterviewSetupPage before navigation).
//         isTimed is forwarded to SessionTimer so the backend countdown
//         is shown instead of local elapsed.

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Send,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  XCircle,
  ChevronRight,
  Trophy,
  Loader2,
  Code2,
  AlignLeft,
  Keyboard,
  Zap,
  Timer,
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
import { SessionTimer } from '@/components/interview/SessionTimer';
import { CodeExecutionPanel } from '@/components/interview/CodeExecutionPanel';
import { getDifficultyBadge } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──────────────────────────────────────────────────────────────────

type PagePhase = 'answering' | 'feedback' | 'completed';
type AnswerTab = 'text' | 'code';

interface FeedbackState {
  score: number;
  feedback: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        className,
      )}
    >
      {loading ? <Loader2 className='size-4 animate-spin' /> : children}
    </button>
  );
}

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
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        className,
      )}
    >
      {loading && <Loader2 className='size-3.5 animate-spin' />}
      {children}
    </button>
  );
}

// ── FEAT-4: Keyboard shortcuts legend ─────────────────────────────────────

function ShortcutsLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
      <Keyboard className='size-3.5 shrink-0' />
      <span>
        <kbd className='rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]'>
          Ctrl
        </kbd>
        +
        <kbd className='rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]'>
          ↵
        </kbd>{' '}
        Submit
      </span>
      <span>
        <kbd className='rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]'>
          H
        </kbd>{' '}
        Hint
      </span>
      <span>
        <kbd className='rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]'>
          P
        </kbd>{' '}
        Pause
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // FEAT-6: read flags set by setup page
  const isTimed = sessionStorage.getItem('interview_isTimed') === 'true';
  const adaptiveMode =
    sessionStorage.getItem('interview_adaptiveMode') === 'true';

  const [phase, setPhase] = useState<PagePhase>('answering');
  const [answerTab, setAnswerTab] = useState<AnswerTab>('text');
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackState | null>(
    null,
  );
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // FEAT-5: timer expiry state
  const [timerExpired, setTimerExpired] = useState(false);
  const autoSubmittedRef = useRef(false);

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isPaused,
    isCompleted,
    type: sessionType,
  } = useInterviewStore();

  const submitAnswer = useSubmitAnswer();
  const requestHint = useRequestHint(sessionId!);
  const pauseSession = usePauseSession();
  const resumeSession = useResumeSession();
  const skipQuestion = useSkipQuestion();
  const endInterview = useEndInterview();

  const isDSA = sessionType === 'dsa';

  // Local elapsed timer
  useEffect(() => {
    if (phase !== 'answering' || isPaused || isCompleted) return;
    const id = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, isPaused, isCompleted]);

  // Sync isCompleted → phase
  useEffect(() => {
    if (isCompleted && phase !== 'completed') setPhase('completed');
  }, [isCompleted, phase]);

  // Reset answer tab on new question
  useEffect(() => {
    if (phase === 'answering') setAnswerTab('text');
  }, [currentQuestionIndex, phase]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    (codeOverride?: string) => {
      const finalAnswer = codeOverride ?? answer;
      if (!sessionId) return;
      // Allow empty submit for auto-expiry path
      const payload = finalAnswer.trim() || '[TIME_EXPIRED]';
      submitAnswer.mutate(
        { sessionId, answer: payload, timeSpent },
        {
          onSuccess: (data) => {
            setPendingFeedback({ score: data.score, feedback: data.feedback });
            setPhase(data.sessionCompleted ? 'completed' : 'feedback');
          },
        },
      );
    },
    [answer, sessionId, timeSpent, submitAnswer],
  );

  const handleNextQuestion = () => {
    setAnswer('');
    setHints([]);
    setShowHints(false);
    setTimeSpent(0);
    setPendingFeedback(null);
    setTimerExpired(false);
    autoSubmittedRef.current = false;
    setPhase('answering');
  };

  const handleHint = useCallback(() => {
    if (!sessionId || hintsExhaustedRef.current) return;
    requestHint.mutate(undefined, {
      onSuccess: (data) => {
        setHints((h) => [...h, data.hint]);
        setShowHints(true);
      },
    });
  }, [sessionId, requestHint]);

  const handlePauseResume = useCallback(() => {
    if (!sessionId) return;
    isPaused ? resumeSession.mutate(sessionId) : pauseSession.mutate(sessionId);
  }, [sessionId, isPaused, pauseSession, resumeSession]);

  const handleSkip = () => {
    if (!sessionId) return;
    skipQuestion.mutate(sessionId, {
      onSuccess: (data) => {
        setAnswer('');
        setHints([]);
        setShowHints(false);
        setTimeSpent(0);
        setTimerExpired(false);
        autoSubmittedRef.current = false;
        if (data.sessionCompleted) setPhase('completed');
      },
    });
  };

  const handleEnd = () => {
    if (!sessionId) return;
    endInterview.mutate(sessionId);
  };

  // FEAT-5: auto-submit when timer expires
  const handleTimerExpired = useCallback(() => {
    if (autoSubmittedRef.current || phase !== 'answering') return;
    autoSubmittedRef.current = true;
    setTimerExpired(true);
    handleSubmit();
  }, [phase, handleSubmit]);

  // FEAT-4: keyboard shortcuts
  const hintsExhaustedRef = useRef(false);
  hintsExhaustedRef.current =
    hints.length >= (currentQuestion?.hints?.length ?? 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire when user is typing in a textarea or input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT') return;

      // Ctrl+Enter → submit (only in text tab / not in code panel textarea)
      if (
        e.ctrlKey &&
        e.key === 'Enter' &&
        answerTab === 'text' &&
        phase === 'answering'
      ) {
        e.preventDefault();
        if (answer.trim() && !submitAnswer.isPending) handleSubmit();
        return;
      }

      if (tag === 'TEXTAREA') return; // remaining shortcuts don't apply inside textarea

      switch (e.key.toLowerCase()) {
        case 'h':
          if (
            phase === 'answering' &&
            !requestHint.isPending &&
            !hintsExhaustedRef.current
          ) {
            e.preventDefault();
            handleHint();
          }
          break;
        case 'p':
          if (phase === 'answering') {
            e.preventDefault();
            handlePauseResume();
          }
          break;
        case 'escape':
          if (showEndConfirm) setShowEndConfirm(false);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    phase,
    answer,
    answerTab,
    submitAnswer.isPending,
    requestHint.isPending,
    showEndConfirm,
    handleSubmit,
    handleHint,
    handlePauseResume,
  ]);

  // ── Guards ─────────────────────────────────────────────────────────────

  if (!currentQuestion && phase === 'answering' && !isCompleted) {
    return <LoadingScreen message='Loading question...' />;
  }

  const progress =
    totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const hintsExhausted = hints.length >= (currentQuestion?.hints?.length ?? 0);
  const isSubmitting = submitAnswer.isPending;
  const isPauseLoading = pauseSession.isPending || resumeSession.isPending;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className='max-w-3xl mx-auto space-y-4 animate-fade-in'>
      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <Progress value={progress} className='w-32 h-1.5' />
          {/* Mode badges */}
          {isTimed && (
            <span className='flex items-center gap-1 text-xs text-primary'>
              <Timer className='size-3' /> Timed
            </span>
          )}
          {adaptiveMode && (
            <span className='flex items-center gap-1 text-xs text-yellow-400'>
              <Zap className='size-3' /> Adaptive
            </span>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {/* FEAT-4: shortcuts toggle */}
          <button
            type='button'
            onClick={() => setShowShortcuts((s) => !s)}
            title='Keyboard shortcuts'
            className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            <Keyboard className='size-4' />
          </button>

          {/* FEAT-6: isTimed forwarded to SessionTimer */}
          <SessionTimer
            sessionId={sessionId!}
            isPaused={isPaused}
            isTimed={isTimed}
            localElapsed={timeSpent}
            onExpired={handleTimerExpired}
          />

          <IconButton
            onClick={handlePauseResume}
            disabled={phase === 'feedback'}
            loading={isPauseLoading}
            title={isPaused ? 'Resume (P)' : 'Pause (P)'}
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
                           text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FEAT-4: Shortcuts legend */}
      {showShortcuts && phase === 'answering' && (
        <div className='rounded-lg border border-border bg-secondary/30 px-4 py-2.5'>
          <ShortcutsLegend visible />
        </div>
      )}

      {/* Paused banner */}
      {isPaused && (
        <div className='rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center text-sm text-yellow-400'>
          Session paused — press{' '}
          <kbd className='rounded border border-yellow-500/30 bg-yellow-500/10 px-1 font-mono text-xs'>
            P
          </kbd>{' '}
          or click play to continue.
        </div>
      )}

      {/* FEAT-5: Auto-submit banner */}
      {timerExpired && phase === 'answering' && (
        <div className='rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-sm text-red-400'>
          ⏰ Time expired — submitting your current answer automatically…
        </div>
      )}

      {/* ══ PHASE: answering ═══════════════════════════════════════════════ */}
      {phase === 'answering' && currentQuestion && (
        <>
          {/* Question card */}
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
                {isDSA && (
                  <span
                    className='inline-flex items-center gap-1 rounded-full border
                                   border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5
                                   text-xs font-medium text-blue-400'
                  >
                    <Code2 className='size-3' /> DSA
                  </span>
                )}
                {adaptiveMode && (
                  <span
                    className='inline-flex items-center gap-1 rounded-full border
                                   border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5
                                   text-xs font-medium text-yellow-400'
                  >
                    <Zap className='size-3' /> Adaptive
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-foreground leading-relaxed whitespace-pre-wrap'>
                {currentQuestion.question}
              </p>
            </CardContent>
          </Card>

          {/* Hints */}
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

          {/* Answer area */}
          {!isPaused && (
            <Card>
              <CardContent className='pt-4 space-y-3'>
                {/* DSA tab switcher */}
                {isDSA && (
                  <div className='flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1 w-fit'>
                    {(['text', 'code'] as AnswerTab[]).map((tab) => (
                      <button
                        key={tab}
                        type='button'
                        onClick={() => setAnswerTab(tab)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                          answerTab === tab
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {tab === 'text' ? (
                          <>
                            <AlignLeft className='size-3.5' /> Text
                          </>
                        ) : (
                          <>
                            <Code2 className='size-3.5' /> Code
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Code execution panel */}
                {isDSA && answerTab === 'code' ? (
                  <>
                    <CodeExecutionPanel
                      onSubmit={(code) => handleSubmit(code)}
                      testCases={
                        (currentQuestion as any).testCases ?? undefined
                      }
                      submitLoading={isSubmitting}
                      disabled={isSubmitting}
                    />
                    <div className='flex justify-start'>
                      <TextButton
                        onClick={handleSkip}
                        loading={skipQuestion.isPending}
                        className='text-muted-foreground hover:text-yellow-400 hover:bg-secondary'
                      >
                        {!skipQuestion.isPending && (
                          <SkipForward className='size-3.5' />
                        )}
                        Skip question
                      </TextButton>
                    </div>
                  </>
                ) : (
                  <>
                    <Textarea
                      placeholder='Type your answer here… (Ctrl+Enter to submit)'
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className='min-h-[180px] font-mono text-sm resize-y'
                      disabled={isSubmitting}
                    />
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-1'>
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
                          {!hintsExhausted && (
                            <kbd className='hidden sm:inline ml-0.5 rounded border border-border bg-secondary/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground'>
                              H
                            </kbd>
                          )}
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

                      <Button
                        variant='gradient'
                        size='sm'
                        onClick={() => handleSubmit()}
                        disabled={!answer.trim() || isSubmitting}
                        className='gap-1.5'
                        title='Ctrl+Enter'
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
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ══ PHASE: feedback ════════════════════════════════════════════════ */}
      {phase === 'feedback' && pendingFeedback && currentQuestion && (
        <div className='space-y-4 animate-fade-in'>
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
                  Next Question <ChevronRight className='size-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ PHASE: completed (portal modal) ════════════════════════════════ */}
      {phase === 'completed' &&
        createPortal(
          <div
            className='fixed inset-0 z-[9999] flex items-center justify-center
                        bg-background/80 backdrop-blur-sm animate-fade-in'
          >
            <Card className='w-full max-w-md mx-4 border-primary/30 shadow-2xl'>
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

                {pendingFeedback && (
                  <div className='rounded-xl border border-border bg-secondary/30 p-4 text-left space-y-3'>
                    <div className='flex items-center justify-between'>
                      <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        Last Answer
                      </p>
                      <div
                        className={cn(
                          'text-2xl font-bold tabular-nums',
                          pendingFeedback.score >= 80
                            ? 'text-green-400'
                            : pendingFeedback.score >= 60
                              ? 'text-yellow-400'
                              : 'text-red-400',
                        )}
                      >
                        {pendingFeedback.score}
                        <span className='text-sm text-muted-foreground font-normal'>
                          /100
                        </span>
                      </div>
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
                  View Full Results <ChevronRight className='size-4' />
                </Button>
              </CardContent>
            </Card>
          </div>,
          document.body,
        )}
    </div>
  );
}
