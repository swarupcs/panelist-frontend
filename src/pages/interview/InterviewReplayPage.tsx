// src/pages/interview/InterviewReplayPage.tsx
//
// Full timeline player wired to:
//   GET  /interview/:sessionId/replay
//   POST /interview/replay/:replayId/progress
//
// Features: play/pause, step forward/back, scrubber, speed picker,
// sidebar timeline, per-step detail panel.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  MessageSquare,
  HelpCircle,
  Star,
  Loader2,
  AlertTriangle,
  Clock,
  Rewind,
  FastForward,
  Trophy,
} from 'lucide-react';
import { useReplay } from '@/hooks/useInterview';
import { useUpdateReplayProgress } from '@/hooks/useInterviewExtended';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/common';
import {
  getDifficultyBadge,
  formatInterviewType,
  formatDate,
  getScoreColor,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { ReplayStep } from '@/types/interview-extended';

// ── Constants ──────────────────────────────────────────────────────────────

const SPEEDS = [0.5, 1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

// ms between auto-advances at 1× speed
const BASE_DELAY = 3000;

// ── Step helpers ───────────────────────────────────────────────────────────

function StepIcon({ type }: { type: ReplayStep['type'] }) {
  switch (type) {
    case 'question':
      return <HelpCircle className='size-3.5' />;
    case 'answer':
      return <MessageSquare className='size-3.5' />;
    case 'hint':
    case 'feedback':
      return <Star className='size-3.5' />;
  }
}

function stepChipColor(type: ReplayStep['type']): string {
  switch (type) {
    case 'question':
      return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    case 'answer':
      return 'text-green-400 border-green-500/20 bg-green-500/10';
    case 'hint':
      return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    case 'feedback':
      return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
  }
}

// ── Step detail panel ──────────────────────────────────────────────────────

function StepDetail({ step }: { step: ReplayStep }) {
  const d = step.data as Record<string, any>;

  // ── Interview started ──────────────────────────────────────────────────
  if (step.type === 'question' && d.action === 'interview_started') {
    return (
      <div className='space-y-3'>
        <p className='text-sm font-semibold text-foreground'>
          Interview Started
        </p>
        <div className='grid grid-cols-2 gap-2 text-xs'>
          {[
            ['Type', formatInterviewType(d.sessionInfo?.type ?? '')],
            ['Difficulty', d.sessionInfo?.difficulty ?? '—'],
            ['Questions', d.sessionInfo?.totalQuestions ?? '—'],
            ['Timed', d.sessionInfo?.isTimed ? 'Yes' : 'No'],
          ].map(([label, val]) => (
            <div
              key={label}
              className='rounded-lg border border-border bg-secondary/30 p-2'
            >
              <p className='text-muted-foreground'>{label}</p>
              <p className='text-foreground font-medium capitalize'>{val}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Question ───────────────────────────────────────────────────────────
  if (step.type === 'question') {
    return (
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground'>
            Question {(d.questionIndex ?? 0) + 1}
          </span>
          {d.category && (
            <Badge variant='outline' className='text-xs'>
              {d.category}
            </Badge>
          )}
          {d.difficulty && (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                getDifficultyBadge(d.difficulty),
              )}
            >
              {d.difficulty}
            </span>
          )}
        </div>
        <p className='text-sm text-foreground leading-relaxed whitespace-pre-wrap'>
          {d.question}
        </p>
        {Array.isArray(d.hints) && d.hints.length > 0 && (
          <div className='rounded-lg border border-primary/20 bg-primary/5 p-3'>
            <p className='text-xs font-semibold text-primary mb-1'>
              Available Hints
            </p>
            <ul className='space-y-1'>
              {d.hints.map((h: string, i: number) => (
                <li key={i} className='text-xs text-muted-foreground'>
                  {i + 1}. {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── Answer ─────────────────────────────────────────────────────────────
  if (step.type === 'answer') {
    return (
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground'>
            Answer — Q{(d.questionIndex ?? 0) + 1}
          </span>
          {d.timeSpent != null && (
            <span className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Clock className='size-3' />
              {Math.floor(d.timeSpent / 60)}m {d.timeSpent % 60}s
            </span>
          )}
          {d.wasAutoSubmitted && (
            <Badge
              variant='outline'
              className='text-xs text-yellow-400 border-yellow-500/30'
            >
              Auto-submitted
            </Badge>
          )}
        </div>
        {d.userAnswer && d.userAnswer !== '[SKIPPED]' ? (
          <pre className='text-xs text-foreground bg-secondary/30 rounded-lg border border-border p-3 overflow-auto whitespace-pre-wrap font-mono'>
            {d.userAnswer}
          </pre>
        ) : (
          <p className='text-xs text-muted-foreground italic'>
            Question was skipped.
          </p>
        )}
      </div>
    );
  }

  // ── Interview completed ────────────────────────────────────────────────
  if (step.type === 'feedback' && d.action === 'interview_completed') {
    return (
      <div className='space-y-3 text-center'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-primary/10 p-3'>
            <Trophy className='size-8 text-primary' />
          </div>
        </div>
        <p className='text-sm font-semibold text-foreground'>
          Interview Completed
        </p>
        {d.finalScore != null && (
          <div className='flex justify-center'>
            <ScoreRing score={Math.round(Number(d.finalScore))} size={80} />
          </div>
        )}
        {d.feedback && (
          <div className='text-left prose prose-sm prose-invert max-w-none prose-p:text-foreground prose-p:leading-relaxed'>
            <ReactMarkdown>{d.feedback}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // ── Per-question feedback ──────────────────────────────────────────────
  if (step.type === 'feedback') {
    const score = Number(d.score ?? 0);
    return (
      <div className='space-y-3'>
        <div>
          <p className='text-xs text-muted-foreground mb-0.5'>
            Q{(d.questionIndex ?? 0) + 1} Score
          </p>
          <p
            className={cn(
              'text-3xl font-bold tabular-nums',
              getScoreColor(score),
            )}
          >
            {score}
            <span className='text-sm text-muted-foreground font-normal'>
              /100
            </span>
          </p>
        </div>
        {d.feedback && (
          <div className='prose prose-sm prose-invert max-w-none prose-p:text-foreground prose-p:leading-relaxed prose-p:my-0 prose-strong:text-foreground'>
            <ReactMarkdown>{d.feedback}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // ── Fallback ───────────────────────────────────────────────────────────
  return (
    <pre className='text-xs text-muted-foreground overflow-auto whitespace-pre-wrap'>
      {JSON.stringify(step.data, null, 2)}
    </pre>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InterviewReplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: replayData, isLoading, isError } = useReplay(sessionId ?? null);
  const updateProgress = useUpdateReplayProgress();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [replayId, setReplayId] = useState<string | null>(null);

  // Capture replayId from the first response
  useEffect(() => {
    if (replayData?.replayId && !replayId) setReplayId(replayData.replayId);
  }, [replayData, replayId]);

  const timeline: ReplayStep[] = replayData?.recording?.timeline ?? [];
  const totalSteps = timeline.length;

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const id = setTimeout(
      () => setCurrentStep((s) => s + 1),
      BASE_DELAY / speed,
    );
    return () => clearTimeout(id);
  }, [isPlaying, currentStep, totalSteps, speed]);

  // Sync progress to backend (debounced by useEffect dependency)
  useEffect(() => {
    if (replayId && currentStep > 0) {
      updateProgress.mutate({ replayId, currentStep });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, replayId]);

  const goTo = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
      setIsPlaying(false);
    },
    [totalSteps],
  );

  // ── Loading / error ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <Loader2 className='size-8 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Loading replay…</p>
      </div>
    );
  }

  if (isError || !replayData) {
    return (
      <div className='max-w-md mx-auto mt-16 text-center space-y-4'>
        <AlertTriangle className='size-10 text-destructive mx-auto' />
        <h2 className='text-lg font-semibold text-foreground'>
          Could not load replay
        </h2>
        <p className='text-sm text-muted-foreground'>
          This session may not be available for replay.
        </p>
        <Button variant='outline' onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const session = replayData.recording.session;
  const activeStep = timeline[currentStep];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className='max-w-3xl mx-auto space-y-4 animate-fade-in'>
      {/* Back + meta */}
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <ChevronLeft className='size-4' /> Back
        </button>
        <div>
          <h1 className='text-lg font-bold text-foreground'>
            Interview Replay
          </h1>
          <p className='text-xs text-muted-foreground'>
            {formatInterviewType(session.type)} ·{' '}
            {formatDate(session.startTime)}
            {session.score != null &&
              ` · Score: ${Math.round(Number(session.score))}/100`}
          </p>
        </div>
      </div>

      {/* Player card */}
      <Card>
        <CardContent className='pt-4 space-y-3'>
          {/* Scrubber */}
          <input
            type='range'
            min={0}
            max={Math.max(totalSteps - 1, 0)}
            value={currentStep}
            onChange={(e) => goTo(Number(e.target.value))}
            className='w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary accent-primary'
          />

          <div className='flex items-center justify-between gap-2'>
            {/* Step counter */}
            <span className='text-xs text-muted-foreground tabular-nums'>
              {currentStep + 1} / {totalSteps}
            </span>

            {/* Transport controls */}
            <div className='flex items-center gap-1'>
              {[
                {
                  icon: Rewind,
                  action: () => goTo(0),
                  title: 'Go to start',
                  disabled: currentStep === 0,
                },
                {
                  icon: SkipBack,
                  action: () => goTo(currentStep - 1),
                  title: 'Previous step',
                  disabled: currentStep === 0,
                },
              ].map(({ icon: Icon, action, title, disabled }) => (
                <button
                  key={title}
                  type='button'
                  onClick={action}
                  disabled={disabled}
                  title={title}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40'
                >
                  <Icon className='size-4' />
                </button>
              ))}

              <button
                type='button'
                onClick={() => setIsPlaying((p) => !p)}
                className='rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors'
              >
                {isPlaying ? (
                  <Pause className='size-4' />
                ) : (
                  <Play className='size-4' />
                )}
              </button>

              {[
                {
                  icon: SkipForward,
                  action: () => goTo(currentStep + 1),
                  title: 'Next step',
                  disabled: currentStep >= totalSteps - 1,
                },
                {
                  icon: FastForward,
                  action: () => goTo(totalSteps - 1),
                  title: 'Go to end',
                  disabled: currentStep >= totalSteps - 1,
                },
              ].map(({ icon: Icon, action, title, disabled }) => (
                <button
                  key={title}
                  type='button'
                  onClick={action}
                  disabled={disabled}
                  title={title}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40'
                >
                  <Icon className='size-4' />
                </button>
              ))}
            </div>

            {/* Speed */}
            <div className='flex items-center gap-1'>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type='button'
                  onClick={() => setSpeed(s)}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                    speed === s
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline sidebar + step detail */}
      <div className='grid grid-cols-[180px_1fr] gap-4'>
        {/* Sidebar */}
        <div className='space-y-1 max-h-[520px] overflow-y-auto pr-1'>
          {timeline.map((step, i) => (
            <button
              key={i}
              type='button'
              onClick={() => goTo(i)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors',
                i === currentStep
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full border p-1',
                  i === currentStep
                    ? stepChipColor(step.type)
                    : 'border-border',
                )}
              >
                <StepIcon type={step.type} />
              </span>
              <span className='capitalize truncate'>
                {step.type.replace('_', ' ')}
              </span>
              <span className='ml-auto shrink-0 text-[10px] opacity-60'>
                {i + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Detail */}
        <Card className='self-start'>
          {activeStep ? (
            <>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2'>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                      stepChipColor(activeStep.type),
                    )}
                  >
                    <StepIcon type={activeStep.type} />
                    <span className='capitalize'>{activeStep.type}</span>
                  </span>
                  <span className='text-xs text-muted-foreground ml-auto'>
                    Step {currentStep + 1}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <StepDetail step={activeStep} />
              </CardContent>
            </>
          ) : (
            <CardContent className='py-8 text-center text-sm text-muted-foreground'>
              No steps available
            </CardContent>
          )}
        </Card>
      </div>

      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => navigate(`/interview/results/${sessionId}`)}
        >
          View Full Results
        </Button>
      </div>
    </div>
  );
}
