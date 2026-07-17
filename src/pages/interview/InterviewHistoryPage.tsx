// src/pages/interview/InterviewHistoryPage.tsx
//
// Lists recent sessions via GET /interview/replay/history (replay history
// is the best available "session list" endpoint on this backend).
// Each row: score ring, type, date, action buttons.
// Select up to 2 rows → "Compare Selected" → /interview/compare?s1=&s2=

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Play,
  BarChart3,
  GitCompare,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { useRecentSessions } from '@/hooks/useInterviewExtended';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, ScoreRing, PageHeader } from '@/components/common';
import {
  formatDate,
  formatInterviewType,
  getScoreColor,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { ReplayHistoryItem } from '@/types/interview-extended';

// ── Session row ────────────────────────────────────────────────────────────

function SessionRow({
  item,
  isSelected,
  onSelect,
  onResults,
  onReplay,
}: {
  item: ReplayHistoryItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onResults: (id: string) => void;
  onReplay: (id: string) => void;
}) {
  const score =
    item.session.score != null ? Math.round(Number(item.session.score)) : null;

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
        {/* Checkbox */}
        <input
          type='checkbox'
          checked={isSelected}
          onChange={() => onSelect(item.sessionId)}
          title='Select for comparison'
          className='size-4 rounded border-border accent-primary cursor-pointer shrink-0'
        />

        {/* Score ring */}
        <div className='shrink-0'>
          {score != null ? (
            <ScoreRing score={score} size={48} />
          ) : (
            <div className='size-12 rounded-full border-2 border-border flex items-center justify-center'>
              <span className='text-xs text-muted-foreground'>—</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-semibold text-foreground'>
              {formatInterviewType(item.session.type)}
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatDate(item.session.startTime)}
            </span>
          </div>
          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
            <span>{item.session.totalQuestions} questions</span>
            {score != null && (
              <span className={cn('font-medium', getScoreColor(score))}>
                {score}/100
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-1 shrink-0'>
          <button
            type='button'
            onClick={() => onReplay(item.sessionId)}
            title='Replay session'
            className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            <Play className='size-4' />
          </button>
          <button
            type='button'
            onClick={() => onResults(item.sessionId)}
            title='View results'
            className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            <BarChart3 className='size-4' />
          </button>
          <button
            type='button'
            onClick={() => onResults(item.sessionId)}
            className='flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            Results <ChevronRight className='size-3' />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const { data: sessions, isLoading, isError, refetch } = useRecentSessions();

  const [selected, setSelected] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      // Keep max 2 for comparison
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selected.length !== 2) return;
    navigate(`/interview/compare?s1=${selected[0]}&s2=${selected[1]}`);
  };

  const types = [...new Set(sessions?.map((s) => s.session.type) ?? [])];

  const filtered =
    sessions?.filter(
      (s) => typeFilter === 'all' || s.session.type === typeFilter,
    ) ?? [];

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>
      <PageHeader
        title='Interview History'
        description='Browse and replay your past sessions'
        action={
          <Button
            variant='gradient'
            size='sm'
            onClick={() => navigate('/interview')}
          >
            New Interview
          </Button>
        }
      />

      {/* Filter bar + compare toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Filter className='size-4 text-muted-foreground' />
          <div className='flex gap-1'>
            {['all', ...types].map((t) => (
              <button
                key={t}
                type='button'
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  typeFilter === t
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {t === 'all' ? 'All' : formatInterviewType(t)}
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleCompare}
            disabled={selected.length !== 2}
            className='gap-1.5'
          >
            <GitCompare className='size-3.5' />
            {selected.length === 2
              ? 'Compare Selected'
              : `Select ${2 - selected.length} more`}
          </Button>
        )}
      </div>

      {selected.length === 1 && (
        <p className='text-xs text-muted-foreground'>
          Select one more session to compare.
        </p>
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
          title='No sessions yet'
          description='Start your first interview to see your history here.'
          action={
            <Button variant='gradient' onClick={() => navigate('/interview')}>
              Start Interview
            </Button>
          }
        />
      ) : (
        <div className='space-y-2'>
          {filtered.map((item) => (
            <SessionRow
              key={item.id}
              item={item}
              isSelected={selected.includes(item.sessionId)}
              onSelect={toggleSelect}
              onResults={(id) => navigate(`/interview/results/${id}`)}
              onReplay={(id) => navigate(`/interview/replay/${id}`)}
            />
          ))}
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <p className='text-xs text-center text-muted-foreground'>
          Showing last {sessions.length} session
          {sessions.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
