// src/pages/interview/InterviewSessionPage.tsx
//
// EXTENSIONS (on top of existing fixes)
// ─────────────────────────────────────────────────────────────────────────────
// EXT-1  DSA sessions now render a <CodeExecutionPanel> tab so candidates can
//        write, run against test cases (POST /api/code/execute), and submit
//        their code as the answer — all without leaving the page.
//
// EXT-2  The session timer now uses <SessionTimer> which polls
//        GET /api/interview/:sessionId/timer every 10 s and shows the backend
//        countdown for timed sessions. The local elapsed fallback is preserved.
//
// EXT-3  Answer mode tabs: "Text" (original textarea) ↔ "Code" (CodeExecutionPanel)
//        available for DSA interviews.

import { useState, useEffect } from 'react';
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

// ── Types ─────────────────────────────────────────────────────────────────────

type PagePhase = 'answering' | 'feedback' | 'completed';
type AnswerTab = 'text' | 'code';

interface FeedbackState {
  score: number;
  feedback: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50',
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

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

  // Timer tick — local elapsed only when answering and not paused
  useEffect(() => {
    if (phase !== 'answering' || isPaused || isCompleted) return;
    const id = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, isPaused, isCompleted]);

  // Store isCompleted flip (skip on last question path)
  useEffect(() => {
    if (isCompleted && phase !== 'completed') setPhase('completed');
  }, [isCompleted, phase]);

  // Reset to text tab on new question
  useEffect(() => {
    if (phase === 'answering') setAnswerTab('text');
  }, [currentQuestionIndex, phase]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = (codeOverride?: string) => {
    const finalAnswer = codeOverride ?? answer;
    if (!finalAnswer.trim() || !sessionId) return;
    submitAnswer.mutate(
      { sessionId, answer: finalAnswer.trim(), timeSpent },
      {
        onSuccess: (data) => {
          setPendingFeedback({ score: data.score, feedback: data.feedback });
          setPhase(data.sessionCompleted ? 'completed' : 'feedback');
        },
      },
    );
  };

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
      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <Progress value={progress} className='w-32 h-1.5' />
        </div>

        <div className='flex items-center gap-2'>
          {/* EXT-2: SessionTimer — uses backend for timed sessions */}
          <SessionTimer
            sessionId={sessionId!}
            isPaused={isPaused}
            isTimed={false} // set to true if your start flow supports isTimed
            localElapsed={timeSpent}
          />

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

      {/* ══════════════════════════════════════════════════════════════════
          PHASE: answering
      ══════════════════════════════════════════════════════════════════ */}
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
                {/* EXT-3: Tab switcher for DSA */}
                {isDSA && (
                  <div className='flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1 w-fit'>
                    <button
                      type='button'
                      onClick={() => setAnswerTab('text')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        answerTab === 'text'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <AlignLeft className='size-3.5' />
                      Text
                    </button>
                    <button
                      type='button'
                      onClick={() => setAnswerTab('code')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        answerTab === 'code'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Code2 className='size-3.5' />
                      Code
                    </button>
                  </div>
                )}

                {/* EXT-1: Code execution panel */}
                {isDSA && answerTab === 'code' ? (
                  <CodeExecutionPanel
                    onSubmit={(code) => handleSubmit(code)}
                    testCases={(currentQuestion as any).testCases ?? undefined}
                    submitLoading={isSubmitting}
                    disabled={isSubmitting}
                  />
                ) : (
                  <>
                    <Textarea
                      placeholder='Type your answer here... For code, use plain text or specify the language.'
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

                {/* Skip button available on code tab too */}
                {isDSA && answerTab === 'code' && (
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
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PHASE: feedback
      ══════════════════════════════════════════════════════════════════ */}
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
                  Next Question
                  <ChevronRight className='size-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PHASE: completed (portal modal)
      ══════════════════════════════════════════════════════════════════ */}
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
                  View Full Results
                  <ChevronRight className='size-4' />
                </Button>
              </CardContent>
            </Card>
          </div>,
          document.body,
        )}
    </div>
  );
}
