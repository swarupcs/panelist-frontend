// src/pages/analytics/AnalyticsPage.tsx
//
// FIXES
// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT-1  TabsList was rendering as a dark block on the left with TabsContent
//           floating to the right. Root cause: shadcn Tabs renders a flex column
//           but the parent space-y-6 div had an implicit grid context from
//           AppShell. Fixed by giving Tabs its own block wrapper with w-full.
//
// CHART-1   MiniBarChart bars were invisible — the chart area had no explicit
//           height container, so flex items had nothing to fill against. Fixed
//           with a relative positioned wrapper and absolute-positioned bars.
//           Also added tooltip labels and a proper empty state.
//
// CHART-2   Bar colors used hsl() literals that don't resolve in all Tailwind
//           setups. Replaced with explicit Tailwind color classes.
//
// PROGRESS-1 indicatorClassName is not a valid prop on shadcn Progress —
//            it gets spread to the root div, not the indicator. Replaced with
//            a custom ProgressBar component that accepts a color class.
//
// UX-1      Tab triggers had no active visual treatment beyond text weight.
//           Replaced with a proper pill-style active state.

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  useAnalyticsDashboard,
  usePerformanceTrends,
  useSkillGaps,
} from '@/hooks/useAnalytics';
import {
  PageHeader,
  StatCard,
  LoadingScreen,
  ErrorState,
} from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  formatScore,
  formatPercent,
  formatDate,
  getScoreBg,
  formatCategory,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';
// Shadcn/Radix Tabs sets display:grid on the root which breaks in this layout.
// Using a plain state-driven tab implementation instead.

// ── Custom ProgressBar ─────────────────────────────────────────────────────
// PROGRESS-1 FIX: shadcn Progress doesn't forward indicatorClassName to the
// inner indicator element. This component does it correctly.

function ProgressBar({
  value,
  className = '',
  indicatorClass = 'bg-primary',
}: {
  value: number;
  className?: string;
  indicatorClass?: string;
}) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          indicatorClass,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
// CHART-1 + CHART-2 FIX: explicit height wrapper, absolute bars, Tailwind colors

function MiniBarChart({
  data,
}: {
  data: { date: string; averageScore: number; interviewCount: number }[];
}) {
  if (!data?.length) {
    return (
      <div className='h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground'>
        <Calendar className='size-6 opacity-40' />
        <span className='text-sm'>No data yet — complete some interviews</span>
      </div>
    );
  }

  const recent = data.slice(-20);
  const max = Math.max(...recent.map((d) => d.averageScore), 1);

  return (
    <div className='space-y-2'>
      {/* Chart area */}
      <div className='flex items-end gap-1 h-28 w-full'>
        {recent.map((d, i) => {
          const pct = max > 0 ? (d.averageScore / max) * 100 : 0;
          const height = d.interviewCount > 0 ? Math.max(pct, 4) : 2;
          const isGood = d.averageScore >= 70;
          const hasData = d.interviewCount > 0;

          return (
            <div
              key={i}
              className='group relative flex-1 flex flex-col justify-end h-full'
              title={`${formatDate(d.date)}: ${d.interviewCount > 0 ? formatScore(d.averageScore) : 'No interviews'}`}
            >
              <div
                className={cn(
                  'w-full rounded-sm transition-all duration-300',
                  hasData
                    ? isGood
                      ? 'bg-primary hover:bg-primary/80'
                      : 'bg-destructive/70 hover:bg-destructive/90'
                    : 'bg-border',
                )}
                style={{ height: `${height}%` }}
              />
              {/* Tooltip */}
              <div
                className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex
                              flex-col items-center z-10 pointer-events-none'
              >
                <div className='bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg'>
                  <p className='text-muted-foreground'>{formatDate(d.date)}</p>
                  {hasData && (
                    <p
                      className={cn(
                        'font-semibold',
                        isGood ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {formatScore(d.averageScore)}
                    </p>
                  )}
                </div>
                <div className='size-1.5 rotate-45 bg-popover border-r border-b border-border -mt-1' />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels — first and last date */}
      <div className='flex justify-between text-xs text-muted-foreground px-0.5'>
        <span>{formatDate(recent[0]?.date)}</span>
        <span>{formatDate(recent[recent.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(30);
  const [activeTab, setActiveTab] = useState<
    'performance' | 'topics' | 'gaps' | 'weak'
  >('performance');

  const { data, isLoading, isError, refetch } = useAnalyticsDashboard();
  const { data: trends } = usePerformanceTrends(trendDays);
  const { data: skillGaps } = useSkillGaps();

  if (isLoading) return <LoadingScreen message='Loading analytics...' />;
  if (isError)
    return <ErrorState message='Failed to load analytics' onRetry={refetch} />;

  const stats = data?.statistics;
  const comparative = data?.comparative;

  return (
    <div className='space-y-6 animate-fade-in'>
      <PageHeader
        title='Analytics'
        description='Track your interview performance and progress'
      />

      {/* Stat cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='Total Interviews'
          value={stats?.totalInterviews ?? 0}
          icon={BarChart3}
        />
        <StatCard
          title='Avg Score'
          value={stats ? formatScore(stats.averageScore) : '—'}
          icon={TrendingUp}
        />
        <StatCard
          title='Completion Rate'
          value={stats ? formatPercent(stats.completionRate) : '—'}
          icon={Target}
        />
        <StatCard
          title='Global Rank'
          value={comparative?.userRank ? `#${comparative.userRank}` : '—'}
          subtitle={comparative ? `Top ${comparative.percentile}%` : undefined}
          icon={Users}
        />
      </div>

      {/* LAYOUT FIX: plain state-driven tabs — no Radix/shadcn grid interference */}
      <div className='w-full space-y-4'>
        {/* Tab bar */}
        <div className='flex gap-1 rounded-lg bg-secondary/50 p-1 w-full'>
          {(['performance', 'topics', 'gaps', 'weak'] as const).map((tab) => {
            const labels: Record<string, string> = {
              performance: 'Performance',
              topics: 'Topics',
              gaps: 'Skill Gaps',
              weak: 'Weak Areas',
            };
            return (
              <button
                key={tab}
                type='button'
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                )}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        <div className='w-full'>
          {/* ── Performance ── */}
          {activeTab === 'performance' && (
            <div className='space-y-4'>
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-base'>Score Trends</CardTitle>
                    <div className='flex gap-1'>
                      {[7, 14, 30, 60].map((d) => (
                        <button
                          key={d}
                          type='button'
                          onClick={() => setTrendDays(d)}
                          className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            trendDays === d
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                          )}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <MiniBarChart data={trends ?? []} />
                  <div className='flex items-center gap-4 mt-4 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <div className='size-2.5 rounded-sm bg-primary' />
                      Score ≥ 70
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <div className='size-2.5 rounded-sm bg-destructive/70' />
                      Score &lt; 70
                    </div>
                  </div>
                </CardContent>
              </Card>

              {comparative && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>vs Community</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-5'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Your score
                        </span>
                        <span className='font-semibold text-foreground'>
                          {formatScore(comparative.userAverageScore)}
                        </span>
                      </div>
                      <ProgressBar
                        value={comparative.userAverageScore}
                        indicatorClass='bg-primary'
                      />
                    </div>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Global average
                        </span>
                        <span className='font-semibold text-foreground'>
                          {formatScore(comparative.globalAverageScore)}
                        </span>
                      </div>
                      <ProgressBar
                        value={comparative.globalAverageScore}
                        indicatorClass='bg-muted-foreground'
                      />
                    </div>
                    <p className='text-xs text-muted-foreground pt-1'>
                      You're ranked{' '}
                      <span className='text-primary font-semibold'>
                        #{comparative.userRank}
                      </span>{' '}
                      out of{' '}
                      <span className='text-foreground font-semibold'>
                        {comparative.totalUsers.toLocaleString()}
                      </span>{' '}
                      users (top {comparative.percentile}%)
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Topics ── */}
          {activeTab === 'topics' && (
            <div className='space-y-3'>
              {!data?.topicPerformance?.length ? (
                <Card>
                  <CardContent className='py-12 text-center text-muted-foreground text-sm'>
                    <BarChart3 className='size-8 mx-auto mb-2 opacity-40' />
                    Complete some interviews to see topic performance
                  </CardContent>
                </Card>
              ) : (
                data.topicPerformance.map((topic) => (
                  <div
                    key={topic.topic}
                    className='rounded-xl border border-border bg-card p-4 space-y-3'
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <p className='font-medium text-sm text-foreground truncate'>
                          {formatCategory(topic.topic)}
                        </p>
                        <Badge variant='outline' className='text-xs shrink-0'>
                          {topic.totalQuestions}q
                        </Badge>
                      </div>
                      <div className='flex items-center gap-3 shrink-0'>
                        <span className='text-xs text-muted-foreground'>
                          {formatPercent(topic.successRate)} success
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold px-2 py-0.5 rounded',
                            getScoreBg(topic.averageScore),
                          )}
                        >
                          {formatScore(topic.averageScore)}
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={topic.averageScore}
                      className='h-1.5'
                      indicatorClass={
                        topic.averageScore >= 70
                          ? 'bg-green-400'
                          : topic.averageScore >= 50
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                      }
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Skill Gaps ── */}
          {activeTab === 'gaps' && (
            <div className='space-y-3'>
              {!skillGaps?.skillGaps?.length ? (
                <Card>
                  <CardContent className='py-12 text-center text-muted-foreground text-sm'>
                    <Target className='size-8 mx-auto mb-2 opacity-40' />
                    Complete more interviews to identify skill gaps
                  </CardContent>
                </Card>
              ) : (
                skillGaps.skillGaps.slice(0, 10).map((gap) => (
                  <div
                    key={gap.skill}
                    className='rounded-xl border border-border bg-card p-4 space-y-3'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='font-medium text-sm text-foreground'>
                          {formatCategory(gap.skill)}
                        </p>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          {gap.currentLevel} → {gap.targetLevel}
                        </p>
                      </div>
                      <Badge variant='destructive' className='shrink-0'>
                        Gap: {Math.round(gap.gap)}
                      </Badge>
                    </div>
                    <ProgressBar
                      value={100 - gap.gap}
                      className='h-1.5'
                      indicatorClass='bg-destructive'
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Weak Areas ── */}
          {activeTab === 'weak' && (
            <div className='space-y-3'>
              {!data?.weakAreas?.length ? (
                <Card>
                  <CardContent className='py-12 text-center text-muted-foreground text-sm'>
                    <AlertTriangle className='size-8 mx-auto mb-2 opacity-40' />
                    No weak areas detected yet — great job!
                  </CardContent>
                </Card>
              ) : (
                data.weakAreas.map((area) => (
                  <div
                    key={area.topic}
                    className='rounded-xl border border-border bg-card p-4 space-y-2'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='font-medium text-sm text-foreground'>
                          {area.topic}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {area.category}
                        </p>
                      </div>
                      <Badge variant='destructive' className='shrink-0'>
                        {area.failureCount}x failed
                      </Badge>
                    </div>
                    {area.improvementSuggestions?.length > 0 && (
                      <ul className='space-y-1 pt-1'>
                        {area.improvementSuggestions.slice(0, 2).map((s, i) => (
                          <li
                            key={i}
                            className='text-xs text-muted-foreground flex gap-1.5'
                          >
                            <span className='text-primary shrink-0'>→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
