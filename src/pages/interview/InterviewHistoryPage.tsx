// src/pages/interview/InterviewHistoryPage.tsx
// Uses GET /api/interview/sessions to show ALL user sessions (not just replayed ones).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Play,
  BarChart3,
  GitCompare,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Clock,
} from 'lucide-react';
import { useRecentSessions } from '@/hooks/useInterviewExtended';
import { Button } from '@/components/ui/button';
import { EmptyState, ScoreRing } from '@/components/common';
import {
  formatDate,
  formatInterviewType,
  getScoreColor,
  getDifficultyBadge,
  formatDuration,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { SessionListItem } from '@/types';


// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: {
      label: 'Completed',
      cls: 'text-green-400 border-green-500/30 bg-green-500/10',
    },
    ACTIVE: {
      label: 'In Progress',
      cls: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    PAUSED: {
      label: 'Paused',
      cls: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    },
    ABANDONED: {
      label: 'Abandoned',
      cls: 'text-muted-foreground border-border bg-secondary/30',
    },
  };
  const s = map[status] ?? {
    label: status,
    cls: 'text-muted-foreground border-border bg-secondary/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

// ── Session row ────────────────────────────────────────────────────────────

function SessionRow({
  item,
  isSelected,
  onSelect,
  onResults,
  onReplay,
}: {
  item: SessionListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onResults: (id: string) => void;
  onReplay: (id: string) => void;
}) {
  const score = item.score != null ? Math.round(Number(item.score)) : null;
  const isCompleted = item.status === 'COMPLETED';
  const durationSecs =
    item.duration ??
    (item.endTime && item.startTime
      ? Math.round(
          (new Date(item.endTime).getTime() -
            new Date(item.startTime).getTime()) /
            1000,
        )
      : null);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        isSelected
          ? 'border-primary/40 bg-primary/5'
          : 'border-border hover:bg-secondary/30',
      )}
    >
      <div className='flex items-center gap-4'>
        <input
          type='checkbox'
          checked={isSelected}
          onChange={() => isCompleted && onSelect(item.id)}
          disabled={!isCompleted}
          title={
            isCompleted
              ? 'Select for comparison'
              : 'Only completed sessions can be compared'
          }
          className='size-4 rounded border-border accent-primary cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed'
        />

        <div className='shrink-0'>
          {score != null ? (
            <ScoreRing score={score} size={48} />
          ) : (
            <div className='size-12 rounded-full border-2 border-border flex items-center justify-center'>
              <span className='text-xs text-muted-foreground'>—</span>
            </div>
          )}
        </div>

        <div className='flex-1 min-w-0 space-y-1.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-semibold text-foreground'>
              {formatInterviewType(item.type)}
            </span>
            <StatusBadge status={item.status} />
            {item.difficulty && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  getDifficultyBadge(item.difficulty),
                )}
              >
                {item.difficulty.toLowerCase()}
              </span>
            )}
          </div>
          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
            <span>{formatDate(item.startTime)}</span>
            <span>
              {item.totalQuestions} question
              {item.totalQuestions !== 1 ? 's' : ''}
            </span>
            {score != null && (
              <span className={cn('font-medium', getScoreColor(score))}>
                {score}/100
              </span>
            )}
            {durationSecs != null && durationSecs > 0 && (
              <span className='flex items-center gap-1'>
                <Clock className='size-3' />
                {formatDuration(durationSecs)}
              </span>
            )}
          </div>
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          {isCompleted && (
            <button
              type='button'
              onClick={() => onReplay(item.id)}
              title='Replay'
              className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
            >
              <Play className='size-4' />
            </button>
          )}
          <button
            type='button'
            onClick={() => onResults(item.id)}
            title='Results'
            className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            <BarChart3 className='size-4' />
          </button>
          <button
            type='button'
            onClick={() => onResults(item.id)}
            className='flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            Results <ChevronRight className='size-3' />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ABANDONED', label: 'Abandoned' },
  { value: 'ACTIVE', label: 'In Progress' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'DSA', label: 'DSA' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'MIXED', label: 'Mixed' },
];

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const {
    data: sessions,
    isLoading,
    isError,
    refetch,
  } = useRecentSessions({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const sessionList: SessionListItem[] = Array.isArray(sessions)
    ? sessions
    : [];

  const filtered = sessionList.filter(
    (s) => typeFilter === 'all' || s.type === typeFilter,
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className='animate-fade-in w-full space-y-5'>
      {/* ── Hero ── */}
      <section className='relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-6'>
        <div
          aria-hidden
          className='pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/20 blur-3xl'
        />
        <div className='relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
          <div>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary'>
              <History className='size-3' />
              Past sessions
            </span>
            <h1 className='mt-2.5 text-2xl font-semibold tracking-tight text-foreground'>
              Interview history
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Every session you have run, and how each one went.
            </p>
          </div>
          <Button
            variant='gradient'
            size='sm'
            onClick={() => navigate('/interview')}
            className='shrink-0'
          >
            New interview
          </Button>
        </div>
      </section>

      {/* Status filter */}
      <div className='space-y-2'>
        <div className='flex flex-wrap gap-1.5'>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type='button'
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type='button'
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                typeFilter === f.value
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compare toolbar */}
      {selected.length > 0 && (
        <div className='flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5'>
          <p className='text-xs text-muted-foreground'>
            {selected.length === 2
              ? '2 sessions selected'
              : 'Select 1 more to compare'}
          </p>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setSelected([])}
              className='text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Clear
            </button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                navigate(
                  `/interview/compare?s1=${selected[0]}&s2=${selected[1]}`,
                )
              }
              disabled={selected.length !== 2}
              className='gap-1.5 h-7 text-xs'
            >
              <GitCompare className='size-3.5' /> Compare
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='size-8 animate-spin text-primary' />
        </div>
      ) : isError ? (
        <EmptyState
          icon={History}
          title='Could not load history'
          description='An error occurred while fetching your sessions.'
          action={
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={
            statusFilter || typeFilter !== 'all'
              ? 'No sessions found'
              : 'No sessions yet'
          }
          description={
            statusFilter || typeFilter !== 'all'
              ? 'Try changing the filters above.'
              : 'Start your first interview to see your history here.'
          }
          action={
            <Button variant='gradient' onClick={() => navigate('/interview')}>
              Start Interview
            </Button>
          }
        />
      ) : (
        /* Two columns on a wide screen. A session row is a score, a few
           badges and three buttons; run across 1163px the middle is mostly
           gap, and twenty of them make a very long page for very little. */
        <div className='grid gap-2 xl:grid-cols-2'>
          {filtered.map((item) => (
            <SessionRow
              key={item.id}
              item={item}
              isSelected={selected.includes(item.id)}
              onSelect={toggleSelect}
              onResults={(id) => navigate(`/interview/results/${id}`)}
              onReplay={(id) => navigate(`/interview/replay/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Footer: count + pagination */}
      {sessionList.length > 0 && (
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            {filtered.length} session{filtered.length !== 1 ? 's' : ''}
            {statusFilter
              ? ` · ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}`
              : ''}
          </span>
          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='rounded-md p-1.5 hover:bg-secondary transition-colors disabled:opacity-30'
            >
              <ChevronLeft className='size-4' />
            </button>
            <span className='px-2 py-1 rounded-md bg-secondary/30 tabular-nums'>
              {page}
            </span>
            <button
              type='button'
              onClick={() => setPage((p) => p + 1)}
              disabled={sessionList.length < 20}
              className='rounded-md p-1.5 hover:bg-secondary transition-colors disabled:opacity-30'
            >
              <ChevronRight className='size-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
