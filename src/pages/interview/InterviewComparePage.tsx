// src/pages/interview/InterviewComparePage.tsx
// Wires GET /interview/compare?sessionId1=&sessionId2=
// Reached from: /interview/compare?s1=xxx&s2=yyy
// Also reached from history page "Compare" button.

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useCompareAttempts } from '@/hooks/useInterview';
import { useRecentSessions } from '@/hooks/useInterviewExtended';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/common';
import {
  formatDate,
  formatInterviewType,
  getScoreColor,
  formatDuration,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';

// ── Helpers ───────────────────────────────────────────────────────────────────

function DeltaBadge({
  value,
  unit = '',
  invert = false,
}: {
  value: number;
  unit?: string;
  invert?: boolean;
}) {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-green-400'
      : 'text-red-400';

  return (
    <div className={cn('flex items-center gap-1 text-sm font-medium', color)}>
      <Icon className='size-3.5' />
      {value > 0 ? '+' : ''}
      {value}
      {unit}
    </div>
  );
}

// ── Session selector ──────────────────────────────────────────────────────────

function SessionSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const { data: sessions, isLoading } = useRecentSessions();

  return (
    <div className='space-y-1.5'>
      <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
        {label}
      </label>
      {isLoading ? (
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Loader2 className='size-3.5 animate-spin' /> Loading sessions…
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm',
            'text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50',
          )}
        >
          <option value=''>Select a session…</option>
          {sessions?.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {formatInterviewType(s.session.type)} ·{' '}
              {formatDate(s.session.startTime)} · Score:{' '}
              {s.session.score != null
                ? Math.round(Number(s.session.score))
                : '—'}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InterviewComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [session1, setSession1] = useState(searchParams.get('s1') ?? '');
  const [session2, setSession2] = useState(searchParams.get('s2') ?? '');

  const {
    data: comparison,
    isLoading,
    isError,
    refetch,
  } = useCompareAttempts(session1 || null, session2 || null);

  const canCompare = !!session1 && !!session2 && session1 !== session2;

  const handleCompare = () => {
    if (!canCompare) return;
    refetch();
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>
      {/* Back + title */}
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
            Compare Attempts
          </h1>
          <p className='text-xs text-muted-foreground'>
            See how you've improved over time
          </p>
        </div>
      </div>

      {/* Session pickers */}
      <Card>
        <CardContent className='pt-5 space-y-4'>
          <div className='grid grid-cols-[1fr_auto_1fr] items-end gap-3'>
            <SessionSelector
              label='First Attempt'
              value={session1}
              onChange={setSession1}
            />
            <div className='pb-2 text-muted-foreground'>
              <ArrowRight className='size-4' />
            </div>
            <SessionSelector
              label='Second Attempt'
              value={session2}
              onChange={setSession2}
            />
          </div>

          {session1 === session2 && session1 && (
            <p className='text-xs text-destructive'>
              Please select two different sessions.
            </p>
          )}

          <Button
            variant='gradient'
            onClick={handleCompare}
            disabled={!canCompare || isLoading}
            className='w-full gap-2'
          >
            {isLoading ? (
              <>
                <Loader2 className='size-4 animate-spin' /> Comparing…
              </>
            ) : (
              <>
                <BarChart3 className='size-4' /> Compare
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error state */}
      {isError && (
        <div
          className='flex items-center gap-3 rounded-xl border border-destructive/20
                        bg-destructive/5 px-4 py-3 text-sm text-destructive'
        >
          <AlertTriangle className='size-4 shrink-0' />
          Could not load comparison. Make sure both sessions belong to your
          account.
        </div>
      )}

      {/* Comparison results */}
      {comparison && (
        <div className='space-y-4 animate-fade-in'>
          {/* Score comparison */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <BarChart3 className='size-4 text-primary' />
                Score Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-4'>
                {/* Session 1 */}
                <div className='text-center space-y-2'>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(comparison.session1.date)}
                  </p>
                  <div className='flex justify-center'>
                    <ScoreRing
                      score={Math.round(Number(comparison.session1.score ?? 0))}
                      size={90}
                    />
                  </div>
                  <div className='space-y-1 text-xs text-muted-foreground'>
                    <div className='flex items-center justify-center gap-1'>
                      <CheckCircle className='size-3 text-green-400' />
                      {comparison.session1.questionsCorrect} correct
                    </div>
                    {comparison.session1.timeSpent != null && (
                      <div className='flex items-center justify-center gap-1'>
                        <Clock className='size-3' />
                        {formatDuration(comparison.session1.timeSpent)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deltas */}
                <div className='flex flex-col items-center gap-3 text-center'>
                  <ArrowRight className='size-5 text-muted-foreground' />
                  <div className='space-y-2'>
                    <div>
                      <p className='text-[10px] text-muted-foreground mb-0.5'>
                        Score
                      </p>
                      <DeltaBadge
                        value={Math.round(comparison.improvement.scoreDelta)}
                      />
                    </div>
                    <div>
                      <p className='text-[10px] text-muted-foreground mb-0.5'>
                        Correct
                      </p>
                      <DeltaBadge value={comparison.improvement.correctDelta} />
                    </div>
                    {comparison.improvement.timeDelta !== 0 && (
                      <div>
                        <p className='text-[10px] text-muted-foreground mb-0.5'>
                          Time
                        </p>
                        <DeltaBadge
                          value={comparison.improvement.timeDelta}
                          unit='s'
                          invert // faster (negative delta) is better
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Session 2 */}
                <div className='text-center space-y-2'>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(comparison.session2.date)}
                  </p>
                  <div className='flex justify-center'>
                    <ScoreRing
                      score={Math.round(Number(comparison.session2.score ?? 0))}
                      size={90}
                    />
                  </div>
                  <div className='space-y-1 text-xs text-muted-foreground'>
                    <div className='flex items-center justify-center gap-1'>
                      <CheckCircle className='size-3 text-green-400' />
                      {comparison.session2.questionsCorrect} correct
                    </div>
                    {comparison.session2.timeSpent != null && (
                      <div className='flex items-center justify-center gap-1'>
                        <Clock className='size-3' />
                        {formatDuration(comparison.session2.timeSpent)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verdict */}
          <Card
            className={cn(
              'border-2',
              comparison.improvement.scoreDelta > 0
                ? 'border-green-500/30 bg-green-500/5'
                : comparison.improvement.scoreDelta < 0
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-border',
            )}
          >
            <CardContent className='pt-5 pb-5'>
              <div className='flex items-center gap-3'>
                {comparison.improvement.scoreDelta > 0 ? (
                  <TrendingUp className='size-6 text-green-400 shrink-0' />
                ) : comparison.improvement.scoreDelta < 0 ? (
                  <TrendingDown className='size-6 text-red-400 shrink-0' />
                ) : (
                  <Minus className='size-6 text-muted-foreground shrink-0' />
                )}
                <div>
                  <p className='font-semibold text-foreground'>
                    {comparison.improvement.scoreDelta > 0
                      ? `Improved by ${comparison.improvement.scoreDelta} points!`
                      : comparison.improvement.scoreDelta < 0
                        ? `Dropped by ${Math.abs(comparison.improvement.scoreDelta)} points`
                        : 'Same score — consistent performance'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {comparison.improvement.correctDelta > 0
                      ? `You got ${comparison.improvement.correctDelta} more question${comparison.improvement.correctDelta !== 1 ? 's' : ''} right.`
                      : comparison.improvement.correctDelta < 0
                        ? `You got ${Math.abs(comparison.improvement.correctDelta)} fewer question${Math.abs(comparison.improvement.correctDelta) !== 1 ? 's' : ''} right.`
                        : 'Same number of correct answers.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jump to either session */}
          <div className='flex gap-3'>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() =>
                navigate(`/interview/results/${comparison.session1.id}`)
              }
            >
              View Session 1 Results
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() =>
                navigate(`/interview/results/${comparison.session2.id}`)
              }
            >
              View Session 2 Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
