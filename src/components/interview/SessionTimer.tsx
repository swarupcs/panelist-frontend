// src/components/interview/SessionTimer.tsx
// Wires GET /api/interview/:sessionId/timer into a live countdown display.
// Polls every 10s when active. Shows warning colors as time runs out.
// Also exposes pause/resume timer controls (POST .../timer/pause, .../timer/resume)

import { useEffect, useState } from 'react';
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTimerStatus } from '@/hooks/useInterview';
import { interviewApi } from '@/api/interview.api';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface SessionTimerProps {
  sessionId: string;
  isPaused: boolean;
  /** If true the timer is shown; if false it falls back to local elapsed */
  isTimed?: boolean;
  /** Local elapsed seconds (from the parent component tick) */
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

  // Poll backend timer only when the session is timed
  const { data: timerData } = useTimerStatus(
    isTimed ? sessionId : null,
    isTimed && !isPaused,
  );

  useEffect(() => {
    if (timerData) {
      setBackendTime(timerData.formattedTime);
      setIsExpired(timerData.isExpired);
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

  // Local fallback display (elapsed time, not countdown)
  function formatLocal(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const displayTime =
    isTimed && backendTime ? backendTime : formatLocal(localElapsed);
  const remainingSecs = timerData?.timeRemaining ?? -1;

  const urgency =
    isTimed && remainingSecs >= 0
      ? remainingSecs <= 60
        ? 'critical' // last 1 min
        : remainingSecs <= 300
          ? 'warning' // last 5 min
          : 'normal'
      : localElapsed > 600
        ? 'warning'
        : localElapsed > 300
          ? 'normal'
          : 'normal';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isExpired ? (
        <div className='flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400'>
          <AlertTriangle className='size-3.5 animate-pulse' />
          Time's up!
        </div>
      ) : (
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
      )}

      {/* Timer pause/resume — only rendered for timed sessions */}
      {isTimed && !isExpired && (
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
