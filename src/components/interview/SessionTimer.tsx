// src/components/interview/SessionTimer.tsx
//
// FIX: Backend returns timeRemaining: -1 / formattedTime: "∞" for untimed sessions.
// Previously the component showed "Timed" and a broken timer even when the backend
// said the session has no timer. Now the backend response is the source of truth.

import { useEffect, useRef, useState, useCallback } from 'react';
import { Timer, Pause, Play, Infinity } from 'lucide-react';
import { useTimerStatus } from '@/hooks/useInterview';
import { formatDuration } from '@/utils/formatters';
import { cn } from '@/lib/cn';

interface SessionTimerProps {
  sessionId: string;
  // isTimed is now just a hint — backend response overrides it
  isTimed?: boolean;
  onExpired?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

export function SessionTimer({
  sessionId,
  isTimed = false,
  onExpired,
  onPause,
  onResume,
  isPaused = false,
}: SessionTimerProps) {
  const expiredFiredRef = useRef(false);
  const [localElapsed, setLocalElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll backend every 5 s when timed
  const { data: timerStatus } = useTimerStatus(sessionId, isTimed);

  // Backend is the source of truth for whether session is really timed
  // timeRemaining === -1 means untimed (server has no timer for this session)
  const backendIsUntimed =
    timerStatus?.timeRemaining === -1 ||
    timerStatus?.formattedTime === '∞' ||
    timerStatus?.formattedTime === 'No timer';

  const isActuallyTimed = isTimed && !backendIsUntimed;

  // Local elapsed counter for untimed sessions
  useEffect(() => {
    if (isActuallyTimed || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setLocalElapsed((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActuallyTimed, isPaused]);

  // Fire onExpired exactly once
  const handleExpired = useCallback(() => {
    if (!expiredFiredRef.current) {
      expiredFiredRef.current = true;
      onExpired?.();
    }
  }, [onExpired]);

  useEffect(() => {
    if (isActuallyTimed && timerStatus?.isExpired && !expiredFiredRef.current) {
      handleExpired();
    }
  }, [isActuallyTimed, timerStatus?.isExpired, handleExpired]);

  // Derived display values
  const timeRemaining = timerStatus?.timeRemaining ?? -1;
  const isLow = isActuallyTimed && timeRemaining > 0 && timeRemaining <= 60;
  const isCritical =
    isActuallyTimed && timeRemaining > 0 && timeRemaining <= 30;

  const displayTime = isActuallyTimed
    ? (timerStatus?.formattedTime ?? '…')
    : formatDuration(localElapsed);

  // ── Untimed session display ──────────────────────────────────────────────
  if (!isActuallyTimed) {
    return (
      <div className='flex items-center gap-1.5 text-muted-foreground'>
        <Timer className='size-3.5' />
        <span className='text-xs font-mono tabular-nums'>{displayTime}</span>
      </div>
    );
  }

  // ── Timed session display ────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-2.5 py-1 transition-colors',
        isCritical
          ? 'border-red-500/40 bg-red-500/10'
          : isLow
            ? 'border-yellow-500/40 bg-yellow-500/10'
            : 'border-border bg-secondary/30',
      )}
    >
      <Timer
        className={cn(
          'size-3.5',
          isCritical
            ? 'text-red-400'
            : isLow
              ? 'text-yellow-400'
              : 'text-primary',
        )}
      />

      <span
        className={cn(
          'text-xs font-mono tabular-nums font-semibold',
          isCritical
            ? 'text-red-400'
            : isLow
              ? 'text-yellow-400'
              : 'text-foreground',
        )}
      >
        {displayTime}
      </span>

      {/* Pause / resume controls */}
      {(onPause || onResume) && (
        <button
          type='button'
          onClick={isPaused ? onResume : onPause}
          className='ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors'
          title={isPaused ? 'Resume timer' : 'Pause timer'}
        >
          {isPaused ? (
            <Play className='size-3' />
          ) : (
            <Pause className='size-3' />
          )}
        </button>
      )}
    </div>
  );
}

// ── Standalone "Timed" badge used in the session header ───────────────────
// Only renders when the session is ACTUALLY timed (backend confirmed).

export function TimedBadge({
  sessionId,
  isTimed = false,
}: {
  sessionId: string;
  isTimed?: boolean;
}) {
  const { data: timerStatus } = useTimerStatus(sessionId, isTimed);

  const backendIsUntimed =
    !timerStatus || // not yet fetched — don't show badge
    timerStatus.timeRemaining === -1 ||
    timerStatus.formattedTime === '∞' ||
    timerStatus.formattedTime === 'No timer';

  if (!isTimed || backendIsUntimed) return null;

  return (
    <span className='flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
      <Timer className='size-3' />
      Timed
    </span>
  );
}
