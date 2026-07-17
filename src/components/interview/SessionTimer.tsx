// src/components/interview/SessionTimer.tsx
//
// Shows elapsed time (local) for untimed sessions.
// Polls GET /interview/:sessionId/timer every 10 s for timed sessions
// and shows the backend countdown with urgency colors.
// Exposes pause/resume timer controls only when isTimed=true.

import { useEffect, useState } from 'react';
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { useTimerStatus } from '@/hooks/useInterview';
import { interviewApi } from '@/api/interview.api';
import { queryClient } from '@/lib/queryClient';

interface SessionTimerProps {
  sessionId: string;
  isPaused: boolean;
  /** true → shows backend countdown; false → shows local elapsed */
  isTimed?: boolean;
  /** Elapsed seconds ticked by the parent */
  localElapsed?: number;
  className?: string;
}

export function SessionTimer({
  sessionId,
  isPaused,
  isTimed = false,
  localElapsed = 0,
  className,
}: SessionTimerProps) {
  const [backendTime, setBackendTime] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [remaining, setRemaining] = useState<number>(-1);

  // Poll backend only when the session is timed and not paused
  const { data: timerData } = useTimerStatus(
    isTimed ? sessionId : null,
    isTimed && !isPaused,
  );

  useEffect(() => {
    if (timerData) {
      setBackendTime(timerData.formattedTime);
      setIsExpired(timerData.isExpired);
      setRemaining(timerData.timeRemaining);
    }
  }, [timerData]);

  const pauseTimer = useMutation({
    mutationFn: () => interviewApi.pauseTimer(sessionId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['interview', 'timer', sessionId],
      }),
  });

  const resumeTimer = useMutation({
    mutationFn: () => interviewApi.resumeTimer(sessionId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['interview', 'timer', sessionId],
      }),
  });

  function formatLocal(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const displayTime =
    isTimed && backendTime ? backendTime : formatLocal(localElapsed);

  // Urgency driven by backend remaining or local elapsed
  const urgency: 'critical' | 'warning' | 'normal' =
    isTimed && remaining >= 0
      ? remaining <= 60
        ? 'critical'
        : remaining <= 300
          ? 'warning'
          : 'normal'
      : localElapsed > 900
        ? 'warning'
        : 'normal';

  if (isExpired) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-md border border-red-500/30',
          'bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400',
          className,
        )}
      >
        <AlertTriangle className='size-3.5 animate-pulse' />
        Time&apos;s up!
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono font-medium transition-colors',
          urgency === 'critical' &&
            'border border-red-500/30 bg-red-500/10 text-red-400 animate-pulse',
          urgency === 'warning' && 'text-yellow-400',
          urgency === 'normal' && 'text-muted-foreground',
        )}
      >
        <Clock className='size-3.5' />
        <span>{displayTime}</span>
      </div>

      {/* Pause/resume timer controls — timed sessions only */}
      {isTimed && (
        <button
          type='button'
          onClick={() =>
            isPaused ? resumeTimer.mutate() : pauseTimer.mutate()
          }
          disabled={pauseTimer.isPending || resumeTimer.isPending}
          title={isPaused ? 'Resume timer' : 'Pause timer'}
          className={cn(
            'rounded-md p-1 text-muted-foreground transition-colors',
            'hover:bg-secondary hover:text-foreground disabled:opacity-50',
          )}
        >
          {isPaused ? (
            <Play className='size-3.5' />
          ) : (
            <Pause className='size-3.5' />
          )}
        </button>
      )}
    </div>
  );
}
