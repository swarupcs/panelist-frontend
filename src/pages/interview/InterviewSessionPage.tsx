// src/pages/interview/InterviewSessionPage.tsx
//
// NEW FEATURES (on top of existing)
// -----------------------------------------------------------------------------
// FEAT-4  Keyboard shortcuts
//           Ctrl+Enter  -> submit current answer (text tab)
//           H           -> request a hint
//           P           -> pause / resume session
//           Escape      -> dismiss end-confirm if open
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Timer,
  AlertCircle,
  AlignLeft,
  Box,
  CheckCircle2,
  ChevronRight,
  Code2,
  Keyboard,
  Lightbulb,
  Loader2,
  MessageSquare,
  Pause,
  PenTool,
  Play,
  Send,
  SkipForward,
  Terminal,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportToBlob } from '@excalidraw/excalidraw';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentQuestion } from '@/store/interviewSlice';
import {
  useSubmitAnswer,
  useRequestHint,
  usePauseSession,
  useResumeSession,
  useSkipQuestion,
  useEndInterview,
} from '@/hooks/useInterview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/common';
import { SessionTimer, TimedBadge } from '@/components/interview/SessionTimer';
import { CodeExecutionPanel } from '@/components/interview/CodeExecutionPanel';
import { useAnswerFollowUp, useSubmitCode } from '@/hooks/usePanelist';
import { DrawingCanvas, type ExcalidrawSnapshotApi } from '@/components/interview/DrawingCanvas';
import type { SubmitDrawingResponse } from '@/types/panelist';
import type { ProgrammingLanguage } from '@/types/interview-extended';
import type { Difficulty, InterviewQuestion } from '@/types';
import { getDifficultyBadge } from '@/utils/formatters';
import { MultiFileEditor } from '@/components/interview/MultiFileEditor';
import { cn } from '@/lib/cn';
import { Textarea } from '@/components/ui/textarea';
import { useSessionRecorder } from '@/hooks/useSessionRecorder';
import { RecordingConsent } from '@/components/interview/RecordingConsent';
import { useSessionContext } from '@/hooks/useSessionContext';
import { useIntegrityMonitor } from '@/hooks/useIntegrityMonitor';

// -- Types ------------------------------------------------------------------

type PagePhase = 'answering' | 'feedback' | 'completed';
type AnswerTab = 'text' | 'code' | 'whiteboard';

interface FeedbackState {
  score: number;
  feedback: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  optimizationSuggestions?: string[];
  communicationScore?: number;
  /** Real sandbox results - present only for executed code submissions. */
  execution?: {
    passed: number;
    total: number;
    allPassed: boolean;
    compileError?: string;
  };
  /** Adaptive follow-up generated from the actual submission. */
  followUp?: string;
}

// -- Helpers ----------------------------------------------------------------

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

// -- FEAT-4: Keyboard shortcuts legend -------------------------------------

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
          Enter
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

// -- Main -------------------------------------------------------------------

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
  // Held so a sketch can be attached to a text answer submitted from another
  // tab, the way the old scratch canvas was.
  const [excalidrawApi, setExcalidrawApi] = useState<ExcalidrawSnapshotApi | null>(null);

  const autoSubmittedRef = useRef(false);

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isPaused,
    isCompleted,
    type: sessionType,
  } = useAppSelector((state) => state.interview);
  const dispatch = useAppDispatch();

  const advanceToNextQuestion = useCallback(
    (nextQuestion: Partial<InterviewQuestion> | null | undefined) => {
      if (!nextQuestion?.id || !nextQuestion.question) return;

      dispatch(
        setCurrentQuestion({
          question: {
            ...nextQuestion,
            id: nextQuestion.id,
            question: nextQuestion.question,
            difficulty: (nextQuestion.difficulty ?? currentQuestion?.difficulty ?? 'medium') as Difficulty,
            category: nextQuestion.category ?? currentQuestion?.category ?? 'DSA',
          },
          index: currentQuestionIndex + 1,
        }),
      );
    },
    [currentQuestion?.category, currentQuestion?.difficulty, currentQuestionIndex, dispatch],
  );
  const submitAnswer = useSubmitAnswer();
  const submitCode = useSubmitCode(sessionId ?? '');
  const answerFollowUp = useAnswerFollowUp(sessionId ?? '');
  const [followUpReply, setFollowUpReply] = useState('');
  const requestHint = useRequestHint(sessionId!);
  const pauseSession = usePauseSession();
  const resumeSession = useResumeSession();
  const skipQuestion = useSkipQuestion();
  const endInterview = useEndInterview();

  // The rules this interview runs under. Null for practice; for an invited
  // interview these come from the recruiter's template and are not the
  // candidate's to change.
  const assessment = useSessionContext(sessionId);

  // Integrity monitoring. Only for invited (recruiter) interviews — a practice
  // session has nothing to proctor and no reviewer to read the signals. Active
  // until the interview completes.
  useIntegrityMonitor(sessionId, assessment.isAssessment && !isCompleted);

  // Read inside the keydown handler, which is registered once and would
  // otherwise close over the first value it saw.
  const allowHintsRef = useRef(true);
  const isAssessmentRef = useRef(false);
  useEffect(() => {
    allowHintsRef.current = assessment.allowHints;
    isAssessmentRef.current = assessment.isAssessment;
  }, [assessment.allowHints, assessment.isAssessment]);

  // Recording. Asked once per session; declining is remembered for the session
  // so the dialog does not reappear on every re-render or reload.
  const recorder = useSessionRecorder(sessionId);
  const [consentAsked, setConsentAsked] = useState(
    () => sessionStorage.getItem(`recording-asked-${sessionId}`) === 'true',
  );
  const [startingRecording, setStartingRecording] = useState(false);

  const rememberAsked = () => {
    if (sessionId) sessionStorage.setItem(`recording-asked-${sessionId}`, 'true');
    setConsentAsked(true);
  };

  const handleAcceptRecording = async () => {
    setStartingRecording(true);
    // The camera is requested only when the interview asks for it. Practice
    // never does.
    const started = await recorder.start({ camera: assessment.requireCamera });
    setStartingRecording(false);
    // Only remember once the question has actually been answered - a browser
    // picker dismissed by accident should get another chance.
    if (started) rememberAsked();
  };

  const handleDeclineRecording = () => {
    // Where a recruiter requires recording, declining declines the interview.
    // That is the honest reading of "required": the alternative is proceeding
    // unrecorded and being marked down for something nobody explained.
    if (assessment.requireRecording) {
      toast.info('This interview cannot go ahead without recording.');
      handleEnd();
      return;
    }
    rememberAsked();
  };

  const isDSA = sessionType === 'dsa';
  const isSystemDesign = sessionType === 'system_design';
  const showTabs = isDSA || isSystemDesign;

  // Local elapsed timer
  useEffect(() => {
    if (phase !== 'answering' || isPaused || isCompleted) return;
    const id = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, isPaused, isCompleted]);

  // Sync isCompleted -> phase
  useEffect(() => {
    if (isCompleted && phase !== 'completed') setPhase('completed');
  }, [isCompleted, phase]);

  // Stop recording the moment the interview is over.
  //
  // Only the explicit End button did this before, so a session that finished
  // by running out of questions left the recorder running: the candidate went
  // on sharing their screen after the interview had ended, chunks kept
  // uploading, and the recording was never finalised - the recruiter view
  // showed "still being recorded" indefinitely.
  useEffect(() => {
    if (phase === 'completed' && recorder.isRecording) {
      void recorder.stop();
    }
  }, [phase, recorder]);

  // Leaving the page ends capture too. Without this, navigating away leaves
  // the screen share live until the tab itself is closed.
  useEffect(() => {
    return () => {
      void recorder.stopSilently();
    };
    // Deliberately once: this is unmount cleanup, and depending on `recorder`
    // would tear the recording down on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DSA answers are code-first. Opening (or advancing) a DSA interview on the
  // text tab made the editor look unavailable until the candidate discovered
  // the secondary "Code" tab themselves.
  useEffect(() => {
    if (phase === 'answering') setAnswerTab(isDSA ? 'code' : 'text');
  }, [currentQuestionIndex, phase, isDSA]);

  // -- Handlers ----------------------------------------------------------

  /**
   * DSA code goes through the session-aware endpoint so it is actually executed
   * against the question's stored test cases, rather than being read by the
   * model as prose. That single call runs the sandbox, evaluates against the
   * real results, records the transcript and advances the interview, so no
   * separate submitAnswer is needed - calling both would grade the same code
   * twice and report two different scores.
   */
  const handleCodeSubmit = useCallback(
    (code: string, language: ProgrammingLanguage) => {
      if (!sessionId) return;

      // Sent explicitly rather than relying on the language stored on the
      // session, so switching language mid-question grades in the runtime the
      // candidate actually wrote in.
      submitCode.mutate(
        { code, language, questionIndex: currentQuestionIndex, final: true, awaitFollowUp: true },
        {
          onSuccess: (data) => {
            advanceToNextQuestion(data.nextQuestion);
            setPendingFeedback({
              score: data.score ?? 0,
              feedback: data.evaluation ?? '',
              timeComplexity: data.timeComplexity,
              spaceComplexity: data.spaceComplexity,
              followUp: data.followUp,
              execution: {
                passed: data.execution.testCasesPassed,
                total: data.execution.testCasesTotal,
                allPassed: data.execution.success,
                compileError: data.execution.compileError,
              },
            });
            setPhase(data.sessionCompleted ? 'completed' : 'feedback');
          },
        },
      );
    },
    [sessionId, currentQuestionIndex, submitCode, advanceToNextQuestion],
  );

  /**
   * A submitted design is evaluated and advances the interview in one call,
   * exactly as a code submission does, so its result flows into the same
   * feedback panel rather than a second one inside the canvas.
   */
  const handleDesignEvaluated = useCallback(
    (result: SubmitDrawingResponse) => {
      setPendingFeedback({
        score: result.score,
        feedback: result.evaluation,
        followUp: result.followUp,
        optimizationSuggestions: result.gaps,
      });
      setPhase(result.sessionCompleted ? 'completed' : 'feedback');
    },
    [],
  );

  /**
   * Answer the interviewer's follow-up, or skip it. Either way the server
   * records the turn and advances, so the next question comes back from here
   * rather than from a second call.
   */
  const handleFollowUp = useCallback(
    (skipped: boolean) => {
      if (!sessionId) return;
      const reply = followUpReply.trim();
      if (!skipped && !reply) return;

      answerFollowUp.mutate(
        { answer: skipped ? undefined : reply, questionIndex: currentQuestionIndex, skipped },
        {
          onSuccess: (data) => {
            advanceToNextQuestion(data.nextQuestion);
            setFollowUpReply('');
            setPendingFeedback(null);
            setAnswer('');
            setHints([]);
            setShowHints(false);
            setTimeSpent(0);
            setPhase(data.sessionCompleted ? 'completed' : 'answering');
          },
        },
      );
    },
    [sessionId, followUpReply, currentQuestionIndex, answerFollowUp, advanceToNextQuestion],
  );

  const handleSubmit = useCallback(
    async (codeOverride?: string) => {
      let imageUrl: string | undefined = undefined;

      if (excalidrawApi) {
        try {
          const elements = excalidrawApi
            .getSceneElements()
            .filter((el) => !(el as { isDeleted?: boolean }).isDeleted);
          if (elements.length > 0) {
            const blob = await exportToBlob({
              elements: elements as never,
              appState: excalidrawApi.getAppState() as never,
              files: excalidrawApi.getFiles() as never,
              mimeType: 'image/png',
            });
            const reader = new FileReader();
            imageUrl = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) {
          console.error('Failed to export whiteboard image', e);
        }
      }

      const finalAnswer = codeOverride ?? answer;
      if (!sessionId) return;
      // Allow empty submit for auto-expiry path or whiteboard
      const payload = finalAnswer.trim() || (imageUrl ? '[WHITEBOARD_SUBMISSION]' : '[TIME_EXPIRED]');
        submitAnswer.mutate(
          { sessionId, answer: payload, timeSpent, imageUrl },
          {
            onSuccess: (data) => {
              setPendingFeedback({ 
                score: data.score, 
                feedback: data.feedback,
                timeComplexity: data.nextQuestion?.timeComplexity || currentQuestion?.timeComplexity || undefined,
                spaceComplexity: data.nextQuestion?.spaceComplexity || currentQuestion?.spaceComplexity || undefined,
                optimizationSuggestions: data.nextQuestion?.optimizationSuggestions || currentQuestion?.optimizationSuggestions || undefined,
                communicationScore: data.communicationScore,
              });
              setPhase(data.sessionCompleted ? 'completed' : 'feedback');
            },
          },
        );
    },
    [answer, sessionId, timeSpent, submitAnswer, excalidrawApi, currentQuestion],
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
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
    // Finalise before ending, so the recording is marked complete rather than
    // interrupted and the last chunks are flushed.
    void recorder.stop();
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
  // eslint-disable-next-line react-hooks/immutability
  hintsExhaustedRef.current =
    hints.length >= (currentQuestion?.hints?.length ?? 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire when user is typing in a textarea or input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT') return;

      // Ctrl+Enter -> submit (only in text tab / not in code panel textarea)
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
            !hintsExhaustedRef.current &&
            // The shortcut is a second door to the same thing; leaving it open
            // would make the hidden button cosmetic.
            allowHintsRef.current
          ) {
            e.preventDefault();
            handleHint();
          }
          break;
        case 'p':
          // Same rule as the button: a shortcut that still worked would make
          // hiding the control cosmetic.
          if (phase === 'answering' && !isAssessmentRef.current) {
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

  // -- Guards -------------------------------------------------------------

  if (!currentQuestion && phase === 'answering' && !isCompleted) {
    return <LoadingScreen message='Loading question...' />;
  }

  const progress =
    totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const hintsExhausted = hints.length >= (currentQuestion?.hints?.length ?? 0);
  const isSubmitting = submitAnswer.isPending || submitCode.isPending;
  const isPauseLoading = pauseSession.isPending || resumeSession.isPending;

  // -- Render -------------------------------------------------------------

  return (
    <div className='animate-fade-in mx-auto max-w-7xl space-y-5'>
      {/* Asked once, before the interview gets going. Not shown again after an
          answer either way - being re-asked to be recorded mid-interview is
          pressure, not a question. */}
      <RecordingConsent
        isOpen={!consentAsked && phase === 'answering' && !isCompleted}
        onAccept={handleAcceptRecording}
        onDecline={handleDeclineRecording}
        isStarting={startingRecording}
        assessment={assessment.context}
      />

      {/* -- Command bar ----------------------------------------------------
          Sticky. The timer, the progress and the way out are the things you
          need at the moment you need them, and they used to scroll away above
          a long code editor — leaving no way to see the time remaining
          without abandoning your place in the answer. */}
      <div className='sticky top-0 z-30 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/50 bg-background/85 p-4 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:gap-0'>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='text-sm font-medium text-foreground'>
            Question {currentQuestionIndex + 1}
            <span className='text-muted-foreground'> of {totalQuestions}</span>
          </span>

          {/* One mark per question rather than a single filled bar. The
              remaining work is the useful part, and a bar at 60% does not say
              whether that is three questions left or one. */}
          <div className='flex items-center gap-1' aria-hidden>
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i < currentQuestionIndex
                    ? 'w-5 bg-primary/70'
                    : i === currentQuestionIndex
                      ? 'w-8 bg-primary'
                      : 'w-5 bg-border',
                )}
              />
            ))}
          </div>
          <span className='sr-only'>{Math.round(progress)}% complete</span>
          {/* Mode badges */}
          <TimedBadge sessionId={sessionId ?? ''} isTimed={isTimed} />
          {/* Always visible while capture runs. Someone being recorded should
              never have to wonder whether they still are. */}
          {recorder.isRecording && (
            recorder.uploadDegraded ? (
              // The toast fires once; this stays. Someone who dismissed it or
              // looked away should still be able to see that the recording is
              // no longer capturing everything.
              <span
                className="flex items-center gap-1.5 text-xs text-amber-400"
                title="Parts of the recording are not uploading. Your interview is unaffected."
              >
                <span className="size-2 rounded-full bg-amber-500" />
                Recording (upload issues)
              </span>
            ) : (
              <span
                className="flex items-center gap-1.5 text-xs text-rose-400"
                title={
                  recorder.isRecordingCamera
                    ? 'Your screen and camera are being recorded'
                    : 'Your screen is being recorded'
                }
              >
                <span className="size-2 animate-pulse rounded-full bg-rose-500" />
                {/* Named explicitly rather than left as "Recording". Somebody
                    on camera should be able to see that they are, at a glance,
                    for as long as it is true. */}
                {recorder.isRecordingCamera ? 'Recording - camera on' : 'Recording'}
              </span>
            )
          )}
          {adaptiveMode && (
            <span className='flex items-center gap-1 text-xs text-yellow-400'>
              <Zap className='size-3' /> Adaptive
            </span>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2 w-full md:w-auto justify-end'>
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

          {/* Hidden during an assessment. The server refuses to pause one, so
              offering a button that returns an error would be a worse
              experience than not offering it - and a paused clock is
              unsupervised time to look up the answer. */}
          {!assessment.isAssessment && (
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
          )}

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
                {endInterview.isPending ? 'Ending...' : 'Yes'}
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
        <div className='rounded-xl border border-border/50 bg-secondary/20 backdrop-blur-md px-4 py-3 shadow-sm'>
          <ShortcutsLegend visible />
        </div>
      )}

      {/* Paused banner */}
      {isPaused && (
        <div className='rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center text-sm text-yellow-400'>
          Session paused - press{' '}
          <kbd className='rounded border border-yellow-500/30 bg-yellow-500/10 px-1 font-mono text-xs'>
            P
          </kbd>{' '}
          or click play to continue.
        </div>
      )}

      {/* FEAT-5: Auto-submit banner */}
      {timerExpired && phase === 'answering' && (
        <div className='rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-sm text-red-400'>
           Time expired - submitting your current answer automatically...
        </div>
      )}

      {/* == PHASE: answering =============================================== */}
      {phase === 'answering' && currentQuestion && (
        /* The prompt on the left, the work on the right. Stacked, the question
           scrolled off the top the moment the editor or the canvas opened, so
           re-reading it meant losing your place in the answer. The left column
           sticks and scrolls on its own for the same reason. */
        <div className='grid gap-5 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:items-start'>
          <div className='space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-1'>
          {/* Question card */}
          <Card className='border-border/50 bg-background/60 backdrop-blur-xl shadow-lg'>
            <CardHeader className='pb-3'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline' className='bg-background/50 backdrop-blur-sm'>{currentQuestion.category}</Badge>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm bg-background/50',
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
              <div className='prose prose-invert prose-p:leading-relaxed max-w-none'>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentQuestion.question}
                </ReactMarkdown>
              </div>
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
          </div>

          {/* Answer area */}
          <div className='min-w-0'>
          {!isPaused && (
            <Card className='border-border/50 bg-background/60 backdrop-blur-xl shadow-lg overflow-hidden'>
              <CardContent className='pt-5 space-y-4'>
                {/* DSA and System Design tab switcher */}
                {showTabs && (
                  <div className='flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1 w-fit'>
                    {(['text', 'code', 'whiteboard'] as AnswerTab[]).map((tab) => {
                      if (tab === 'whiteboard' && !isSystemDesign) return null;
                      return (
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
                          ) : tab === 'code' ? (
                            <>
                              <Code2 className='size-3.5' /> {isSystemDesign ? 'Editor' : 'Code'}
                            </>
                          ) : (
                            <>
                              <PenTool className='size-3.5' /> Whiteboard
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Code execution panel */}
                {isDSA && answerTab === 'code' ? (
                  <>
                    <CodeExecutionPanel
                      sessionId={sessionId}
                      questionIndex={currentQuestionIndex}
                      onSubmit={(code, language) => handleCodeSubmit(code, language)}
                      testCases={
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                ) : isSystemDesign && answerTab === 'code' ? (
                  <>
                    <MultiFileEditor
                      onSubmit={(code) => handleSubmit(code)}
                      submitLoading={isSubmitting}
                      disabled={isSubmitting}
                    />
                    <div className='flex justify-start mt-2'>
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
                ) : answerTab === 'whiteboard' ? (
                  <>
                    {/* Excalidraw is the only whiteboard. It used to share this
                        tab with a second engine behind a toggle, which split
                        the candidate's work across two canvases the
                        interviewer could only read one of — a diagram drawn on
                        the wrong one was silently never evaluated. */}
                    {/* height, not minHeight. Excalidraw's root is
                        `height: 100%`, and a percentage height cannot resolve
                        against an ancestor whose height property is auto — a
                        min-height does not make it definite. The canvas
                        collapsed to 0px inside a visibly 380px box, so the
                        whiteboard was mounted and drawing nothing. */}
                    <div
                      style={{ height: '640px', width: '100%', display: 'flex' }}
                      className='bg-background'
                    >
                      <DrawingCanvas
                        sessionId={sessionId ?? ''}
                        question={currentQuestion?.question}
                        questionIndex={currentQuestionIndex}
                        onEvaluated={handleDesignEvaluated}
                        onApiReady={setExcalidrawApi}
                        className='w-full'
                      />
                    </div>
                    <div className='flex justify-between items-center mt-4'>
                      <p className='text-xs text-muted-foreground'>
                        Label your components and connect them with arrows - unlabelled or unconnected shapes cannot be read by the interviewer.
                      </p>
                      <TextButton
                        onClick={handleSkip}
                        loading={skipQuestion.isPending}
                        className='text-muted-foreground hover:text-yellow-400 hover:bg-secondary shrink-0'
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
                      placeholder='Type your answer here... (Ctrl+Enter to submit)'
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className='min-h-[180px] font-mono text-sm resize-y'
                      disabled={isSubmitting}
                    />
                    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2'>
                      <div className='flex flex-wrap items-center gap-1'>
                        {/* Hidden rather than disabled when a template
                            forbids hints: a greyed-out button invites a
                            candidate to wonder what they are missing during an
                            assessment they are being judged on. */}
                        {assessment.allowHints && (
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
                        )}

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
                        className='gap-1.5 w-full sm:w-auto'
                        title='Ctrl+Enter'
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className='size-3.5 animate-spin' />{' '}
                            Evaluating...
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
          </div>
        </div>
      )}

      {/* == PHASE: feedback ================================================ */}
      {phase === 'feedback' && pendingFeedback && currentQuestion && (
        /* Narrower than the workspace on purpose. This phase is entirely
           reading — feedback prose and a follow-up question — and prose set
           across the full width of a workspace is hard to track back to the
           start of the next line. */
        <div className='mx-auto max-w-3xl space-y-4 animate-fade-in'>
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
              <div className='prose prose-invert prose-sm max-w-none prose-p:leading-relaxed opacity-80'>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentQuestion.question}
                </ReactMarkdown>
              </div>
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

              {/* Real sandbox results. Shown above the prose because this is
                  the objective fact the assessment is reasoning about - the
                  candidate should see what actually ran before reading why. */}
              {pendingFeedback.execution && (
                <div className='rounded-lg border border-border/60 overflow-hidden'>
                  <div className='flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/40'>
                    <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                      <Terminal className='size-3.5' />
                      Test results
                    </span>
                    <span
                      className={
                        pendingFeedback.execution.allPassed
                          ? 'text-xs font-semibold tabular-nums rounded-md px-2 py-0.5 bg-green-500/15 text-green-400'
                          : 'text-xs font-semibold tabular-nums rounded-md px-2 py-0.5 bg-red-500/15 text-red-400'
                      }
                    >
                      {pendingFeedback.execution.passed}/{pendingFeedback.execution.total} passed
                    </span>
                  </div>
                  {pendingFeedback.execution.compileError && (
                    <p className='px-4 py-2 text-xs text-red-400 border-t border-border/40'>
                      Compilation failed - no test case ran.
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                  Feedback
                </p>
                <p className='text-sm text-foreground leading-relaxed'>
                  {pendingFeedback.feedback}
                </p>
              </div>

              {/* The interviewer's follow-up - an actual turn, not a notice.
                  The session is held on this question until it is answered or
                  skipped, so the reply is recorded against the right question. */}
              {pendingFeedback.followUp && (
                <div className='rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3'>
                  <p className='text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2'>
                    <MessageSquare className='size-4' />
                    Interviewer asks
                  </p>
                  <p className='text-sm text-foreground leading-relaxed'>
                    {pendingFeedback.followUp}
                  </p>

                  <Textarea
                    value={followUpReply}
                    onChange={(e) => setFollowUpReply(e.target.value)}
                    placeholder='Answer in your own words...'
                    className='min-h-[90px] text-sm resize-y bg-background'
                    disabled={answerFollowUp.isPending}
                  />

                  <div className='flex flex-wrap items-center gap-2'>
                    <Button
                      onClick={() => handleFollowUp(false)}
                      disabled={!followUpReply.trim() || answerFollowUp.isPending}
                      className='gap-2'
                    >
                      {answerFollowUp.isPending && <Loader2 className='size-4 animate-spin' />}
                      Answer &amp; continue
                    </Button>
                    <TextButton
                      onClick={() => handleFollowUp(true)}
                      disabled={answerFollowUp.isPending}
                      className='text-muted-foreground hover:text-foreground'
                    >
                      Nothing to add - skip
                    </TextButton>
                  </div>
                </div>
              )}

              {(pendingFeedback.timeComplexity || pendingFeedback.spaceComplexity) && (
                <div className='flex items-center gap-3 pt-2'>
                  {pendingFeedback.timeComplexity && (
                    <Badge variant='outline' className='flex items-center gap-1.5 py-1 px-2.5 bg-primary/5 text-primary border-primary/20'>
                      <Zap className='size-3.5' />
                      <span>Time: {pendingFeedback.timeComplexity}</span>
                    </Badge>
                  )}
                  {pendingFeedback.spaceComplexity && (
                    <Badge variant='outline' className='flex items-center gap-1.5 py-1 px-2.5 bg-primary/5 text-primary border-primary/20'>
                      <Box className='size-3.5' />
                      <span>Space: {pendingFeedback.spaceComplexity}</span>
                    </Badge>
                  )}
                </div>
              )}

              {pendingFeedback.optimizationSuggestions && pendingFeedback.optimizationSuggestions.length > 0 && (
                <div className='bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4'>
                  <p className='text-xs font-semibold uppercase tracking-wider text-primary mb-3 flex items-center gap-2'>
                    <Lightbulb className='size-4' />
                    Optimization Suggestions
                  </p>
                  <ul className='space-y-2'>
                    {pendingFeedback.optimizationSuggestions.map((suggestion, idx) => (
                      <li key={idx} className='text-sm text-foreground/90 flex items-start gap-2'>
                        <span className='text-primary mt-0.5 font-bold'>-</span>
                        <span className='leading-relaxed'>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hidden while a follow-up is outstanding. The server holds the
                  interview on this question until the follow-up is answered or
                  skipped, so advancing here would move the UI on while the
                  session stayed put - and the next submission would be graded
                  against the wrong question. The follow-up's own buttons are
                  the way forward in that state. */}
              {!pendingFeedback.followUp && (
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
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* == PHASE: completed (portal modal) ================================ */}
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

                {/* A recruiter may keep the score to themselves. The
                    candidate is never in doubt that they were assessed - only
                    the number is withheld. */}
                {!assessment.candidateSeesResult && (
                  <p className='rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground'>
                    Your answers have gone to {assessment.context?.companyName ?? 'the company'}.
                    They decide whether to share the result with you.
                  </p>
                )}

                {assessment.candidateSeesResult && pendingFeedback && (
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
