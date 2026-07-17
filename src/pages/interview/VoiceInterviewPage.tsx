/**
 * VoiceInterviewPage
 *
 * Full voice-mode interview experience.
 * Route: /interview/voice/:sessionId
 *
 * The session must have been created first via POST /api/interview/start.
 * Navigate here after starting a session to switch to voice mode.
 *
 * Architecture:
 *   VoiceInterviewPage
 *     → useVoiceInterview  (hook)
 *       → VoiceAgentClient  (orchestrator)
 *         → ISTTProvider    (WebSpeech / Deepgram / Gemini)
 *         → ITTSProvider    (WebSpeech / ElevenLabs / Google)
 *         → WebSocket → Backend VoiceSessionService
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Volume2, VolumeX, Pause, Play,
  Lightbulb, XCircle, Trophy, ChevronRight,
  AlertCircle, Loader2, Cpu,
} from 'lucide-react';
import { useVoiceInterview }     from '@/hooks/useVoiceInterview';
import { WaveformVisualizer }    from '@/components/interview/voice/WaveformVisualizer';
import { VoiceStatusBadge }      from '@/components/interview/voice/VoiceStatusBadge';
import { getDifficultyBadge }    from '@/utils/formatters';
import { cn }                    from '@/lib/cn';
import ReactMarkdown             from 'react-markdown';
import remarkGfm                 from 'remark-gfm';

// ── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-emerald-400'
    : score >= 60 ? 'text-yellow-400'
    : 'text-red-400';
  const ring =
    score >= 80 ? 'stroke-emerald-400'
    : score >= 60 ? 'stroke-yellow-400'
    : 'stroke-red-400';

  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className='relative inline-flex items-center justify-center'>
      <svg width={90} height={90} className='-rotate-90'>
        <circle cx={45} cy={45} r={r} fill='none' stroke='currentColor'
          strokeWidth={6} className='text-muted/20' />
        <circle cx={45} cy={45} r={r} fill='none' strokeWidth={6}
          className={ring}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap='round'
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className={cn('absolute text-xl font-bold tabular-nums', color)}>
        {score}
      </span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function VoiceInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate      = useNavigate();
  const [muted, setMuted] = useState(false);

  const {
    state,
    errors,
    clearErrors,
    startSpeaking,
    submitAnswer,
    requestHint,
    pause,
    resume,
    end,
    isConnecting,
    isAISpeaking,
    isListening,
    isThinking,
    isPaused,
    isCompleted,
    isError,
    sttProviderName,
    ttsProviderName,
  } = useVoiceInterview(sessionId);

  // Auto-navigate to results when completed
  useEffect(() => {
    if (isCompleted && sessionId) {
      const timer = setTimeout(() => {
        navigate(`/interview/results/${sessionId}`);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, sessionId, navigate]);

  // Waveform mode
  const waveMode =
    isAISpeaking ? 'speaking'
    : isListening ? 'listening'
    : isThinking  ? 'thinking'
    : 'idle';

  const progress =
    state.totalQuestions > 0
      ? ((state.questionIndex) / state.totalQuestions) * 100
      : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className='min-h-screen bg-background flex flex-col'>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className='border-b border-border/50 bg-card/40 backdrop-blur-md'>
        <div className='max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Cpu className='size-3.5 text-primary' />
              <span>AI Voice Interview</span>
            </div>
            {!isConnecting && (
              <>
                <span className='text-border'>|</span>
                <span className='text-xs text-muted-foreground'>
                  Question {state.questionIndex + 1} / {state.totalQuestions}
                </span>
              </>
            )}
          </div>

          <VoiceStatusBadge phase={state.phase} />

          <div className='flex items-center gap-2'>
            {/* Mute TTS toggle */}
            <button
              type='button'
              onClick={() => setMuted(m => !m)}
              title={muted ? 'Unmute AI voice' : 'Mute AI voice'}
              className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
            >
              {muted ? <VolumeX className='size-4' /> : <Volume2 className='size-4' />}
            </button>

            {/* Pause / Resume */}
            {!isCompleted && !isError && !isConnecting && (
              <button
                type='button'
                onClick={isPaused ? resume : pause}
                title={isPaused ? 'Resume' : 'Pause'}
                className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
              >
                {isPaused
                  ? <Play className='size-4' />
                  : <Pause className='size-4' />
                }
              </button>
            )}

            {/* End session */}
            {!isCompleted && !isConnecting && (
              <EndButton onConfirm={end} />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className='h-0.5 bg-muted/30'>
          <div
            className='h-full bg-primary transition-all duration-500'
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className='flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 max-w-3xl mx-auto w-full'>

        {/* ── CONNECTING ───────────────────────────────────────────────── */}
        {isConnecting && (
          <div className='flex flex-col items-center gap-4 text-center animate-fade-in'>
            <div className='rounded-full bg-primary/10 p-6'>
              <Loader2 className='size-10 text-primary animate-spin' />
            </div>
            <p className='text-lg font-semibold text-foreground'>Connecting to your interview…</p>
            <p className='text-sm text-muted-foreground'>Setting up voice session</p>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────── */}
        {isError && (
          <div className='flex flex-col items-center gap-4 text-center animate-fade-in'>
            <div className='rounded-full bg-destructive/10 p-6'>
              <AlertCircle className='size-10 text-destructive' />
            </div>
            <p className='text-lg font-semibold text-foreground'>Voice session error</p>
            <p className='text-sm text-destructive max-w-sm'>{state.errorMessage}</p>
            <button
              onClick={() => navigate('/interview')}
              className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
            >
              Back to Setup
            </button>
          </div>
        )}

        {/* ── PAUSED ───────────────────────────────────────────────────── */}
        {isPaused && (
          <div className='flex flex-col items-center gap-4 text-center animate-fade-in'>
            <div className='rounded-full bg-yellow-500/10 p-6'>
              <Pause className='size-10 text-yellow-400' />
            </div>
            <p className='text-lg font-semibold text-foreground'>Interview Paused</p>
            <button
              onClick={resume}
              className='flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
            >
              <Play className='size-4' /> Resume Interview
            </button>
          </div>
        )}

        {/* ── ACTIVE ───────────────────────────────────────────────────── */}
        {!isConnecting && !isError && !isPaused && !isCompleted && state.currentQuestion && (
          <>
            {/* AI Avatar + Waveform */}
            <div className='flex flex-col items-center gap-4'>
              {/* Avatar circle */}
              <div className={cn(
                'relative flex items-center justify-center rounded-full size-24',
                'bg-gradient-to-br from-primary/30 to-violet-500/30',
                'border-2 transition-all duration-500',
                isAISpeaking ? 'border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.3)]'
                : isListening ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.25)]'
                : isThinking  ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.2)]'
                : 'border-border/50'
              )}>
                <Cpu className={cn(
                  'size-10 transition-colors duration-300',
                  isAISpeaking ? 'text-violet-400'
                  : isListening ? 'text-emerald-400'
                  : isThinking  ? 'text-amber-400 animate-pulse'
                  : 'text-primary'
                )} />
              </div>

              {/* Waveform */}
              <WaveformVisualizer mode={waveMode} className='h-12 w-64' />

              {/* Status text */}
              <p className='text-sm text-muted-foreground text-center'>
                {isAISpeaking && 'AI interviewer is speaking…'}
                {isListening  && 'Speak your answer clearly. Click "Done" when finished.'}
                {isThinking   && 'Evaluating your answer…'}
              </p>
            </div>

            {/* Question card */}
            <div className='w-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-lg'>
              <div className='flex flex-wrap gap-2 mb-4'>
                <span className='rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground'>
                  {state.currentQuestion.category}
                </span>
                <span className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  getDifficultyBadge(state.currentQuestion.difficulty),
                )}>
                  {state.currentQuestion.difficulty}
                </span>
              </div>
              <div className='prose prose-invert prose-p:leading-relaxed max-w-none mt-2'>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {state.currentQuestion.question}
                </ReactMarkdown>
              </div>
            </div>

            {/* Live transcript */}
            {(isListening || state.currentTranscript) && (
              <div className='w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 min-h-[80px]'>
                <p className='text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5'>
                  <Mic className='size-3' /> Your answer (live)
                </p>
                <p className='text-sm text-foreground leading-relaxed'>
                  {state.currentTranscript || (
                    <span className='text-muted-foreground italic'>Start speaking…</span>
                  )}
                </p>
              </div>
            )}

            {/* Last feedback */}
            {state.lastFeedback && (
              <div className='w-full rounded-xl border border-primary/20 bg-primary/5 p-4'>
                <div className='flex items-start gap-3'>
                  {state.lastScore !== null && <ScoreRing score={state.lastScore} />}
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs font-medium text-primary mb-1'>Previous answer feedback</p>
                    <p className='text-sm text-foreground leading-relaxed line-clamp-4'>
                      {state.lastFeedback}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className='flex flex-wrap items-center justify-center gap-3'>
              {/* Hint */}
              <button
                type='button'
                onClick={requestHint}
                disabled={isThinking || isConnecting}
                className='flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40'
              >
                <Lightbulb className='size-4' /> Hint
                {state.hintsUsed > 0 && (
                  <span className='ml-1 rounded-full bg-primary/20 px-1.5 text-xs text-primary'>
                    {state.hintsUsed}
                  </span>
                )}
              </button>

              {/* Start / Submit speaking */}
              {isListening ? (
                <button
                  type='button'
                  onClick={submitAnswer}
                  className='flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20'
                >
                  <ChevronRight className='size-4' /> Done — Submit Answer
                </button>
              ) : (
                <button
                  type='button'
                  onClick={startSpeaking}
                  disabled={isThinking || isConnecting}
                  className='flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-40'
                >
                  {isThinking
                    ? <><Loader2 className='size-4 animate-spin' /> Evaluating…</>
                    : <><Mic className='size-4' /> Start Speaking</>
                  }
                </button>
              )}
            </div>
          </>
        )}

        {/* ── COMPLETED ────────────────────────────────────────────────── */}
        {isCompleted && (
          <div className='flex flex-col items-center gap-6 text-center animate-fade-in'>
            <div className='rounded-full bg-emerald-500/10 p-6'>
              <Trophy className='size-12 text-emerald-400' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-foreground mb-2'>Interview Complete!</h2>
              <p className='text-muted-foreground'>
                Navigating to your results…
              </p>
            </div>
            {state.overallScore !== null && (
              <div className='flex flex-col items-center gap-2'>
                <ScoreRing score={Math.round(state.overallScore)} />
                <p className='text-sm text-muted-foreground'>Overall Score</p>
              </div>
            )}
          </div>
        )}

        {/* ── Errors toast ─────────────────────────────────────────────── */}
        {errors.length > 0 && (
          <div className='fixed bottom-4 right-4 z-50 space-y-2'>
            {errors.slice(-3).map((err, i) => (
              <div
                key={i}
                className='flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg'
              >
                <AlertCircle className='size-4 shrink-0' />
                <span className='flex-1 max-w-xs'>{err}</span>
                <button onClick={clearErrors} className='hover:text-foreground'>
                  <XCircle className='size-4' />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer: provider info ─────────────────────────────────────── */}
      <footer className='border-t border-border/30 py-2 px-4 text-center'>
        <p className='text-[10px] text-muted-foreground/50'>
          STT: {sttProviderName} · TTS: {ttsProviderName}
        </p>
      </footer>
    </div>
  );
}

// ── End Session Button ────────────────────────────────────────────────────────

function EndButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = () => {
    if (confirming) {
      onConfirm();
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button
      type='button'
      onClick={handleClick}
      title='End session'
      className={cn(
        'rounded-md p-1.5 transition-colors',
        confirming
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
      )}
    >
      {confirming ? (
        <span className='text-xs font-medium px-1'>End?</span>
      ) : (
        <XCircle className='size-4' />
      )}
    </button>
  );
}
