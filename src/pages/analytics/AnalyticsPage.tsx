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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useAnalyticsDashboard,
  usePerformanceTrends,
  useSkillGaps,
} from '@/hooks/useAnalytics';
import { LoadingScreen, ErrorState } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatScore,
  formatPercent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// ── Metric tile ────────────────────────────────────────────────────────────

/**
 * One headline number.
 *
 * The label sits above the value rather than below it. These are read as a
 * row, and scanning four unlabelled numbers and then hunting for what each one
 * meant is slower than reading the question first.
 */
function MetricTile({
  label,
  value,
  subtitle,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition-colors sm:p-5',
        accent
          ? 'border-primary/25 bg-gradient-to-br from-primary/10 to-card'
          : 'border-border/60 bg-card/60',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <p className='min-w-0 truncate text-xs font-medium uppercase tracking-wider text-muted-foreground'>
          {label}
        </p>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            accent ? 'bg-primary/15 text-primary' : 'bg-secondary/60 text-muted-foreground',
          )}
        >
          <Icon className='size-4' />
        </span>
      </div>
      <p className='mt-2 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl'>
        {value}
      </p>
      {subtitle && (
        <p className={cn('mt-0.5 text-xs', accent ? 'text-primary' : 'text-muted-foreground')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

import { ScoreOverTimeChart } from '@/components/analytics/ScoreOverTimeChart';
import { QuestionsPerWeekChart } from '@/components/analytics/QuestionsPerWeekChart';
import { DifficultyDistributionChart } from '@/components/analytics/DifficultyDistributionChart';
import { BenchmarkTab } from './components/BenchmarkTab';

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(30);
  const [activeTab, setActiveTab] = useState<
    'performance' | 'topics' | 'gaps' | 'weak' | 'benchmark'
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
    <div className='animate-fade-in w-full space-y-5'>
      {/* ── Hero ── */}
      <section className='relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-6'>
        <div
          aria-hidden
          className='pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/20 blur-3xl'
        />
        <div className='relative'>
          <span className='inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary'>
            <BarChart3 className='size-3' />
            Your performance
          </span>
          <h1 className='mt-2.5 text-2xl font-semibold tracking-tight text-foreground'>
            Analytics
          </h1>
        </div>
      </section>

      {/* ── Headline metrics ──
          Rank is the only one carrying a comparison to other people, so it is
          the only one given emphasis. Making all four loud would mean none of
          them was. */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <MetricTile
          label='Total interviews'
          value={stats?.totalInterviews ?? 0}
          icon={BarChart3}
        />
        <MetricTile
          label='Average score'
          value={stats ? formatScore(stats.averageScore) : '—'}
          icon={TrendingUp}
        />
        <MetricTile
          label='Completion rate'
          value={stats ? formatPercent(stats.completionRate) : '—'}
          icon={Target}
        />
        <MetricTile
          label='Global rank'
          value={comparative?.userRank ? `#${comparative.userRank}` : '—'}
          subtitle={comparative ? `Top ${comparative.percentile}%` : undefined}
          icon={Users}
          accent
        />
      </div>

      {/* LAYOUT FIX: plain state-driven tabs — no Radix/shadcn grid interference */}
      <div className='w-full space-y-4'>
        {/* Tab bar — sized to its labels rather than stretched across the
            page. Five tabs spread over 1163px put "Performance" and
            "Benchmarking" a screen-width apart and made the selected pill
            enormous, which reads as a banner rather than a control. Scrolls
            horizontally on narrow screens instead of cramming. */}
        <div
          role='tablist'
          className='flex w-full gap-1 overflow-x-auto rounded-xl border border-border/60 bg-secondary/40 p-1 sm:w-fit'
        >
          {(['performance', 'topics', 'gaps', 'weak', 'benchmark'] as const).map((tab) => {
            const labels: Record<string, string> = {
              performance: 'Performance',
              topics: 'Topics',
              gaps: 'Skill gaps',
              weak: 'Weak areas',
              benchmark: 'Benchmarking',
            };
            return (
              <button
                key={tab}
                type='button'
                role='tab'
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
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
                  <ScoreOverTimeChart data={trends ?? []} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Questions per Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionsPerWeekChart data={trends ?? []} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Difficulty Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DifficultyDistributionChart data={data?.difficultyDistribution ?? []} />
                  </CardContent>
                </Card>
              </div>

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

          {/* ── Benchmarking ── */}
          {activeTab === 'benchmark' && (
            <BenchmarkTab />
          )}
        </div>
      </div>
    </div>
  );
}
