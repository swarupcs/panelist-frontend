// src/components/admin/AdminOverviewTab.tsx  (FULL REPLACEMENT)
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingScreen, ErrorState } from '@/components/common'
import { useAdminOverview } from '@/hooks/useAdmin'
import { formatPercent, formatNumber } from '@/utils/formatters'
import { cn } from '@/lib/cn'

export function AdminOverviewTab() {
  const { data, isLoading, isError, refetch } = useAdminOverview()

  if (isLoading) return <LoadingScreen />
  if (isError)   return <ErrorState message="Failed to load overview" onRetry={refetch} />
  if (!data)     return null

  const { users, interviews, questions, engagement } = data

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── User growth metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Users"      value={formatNumber(users.total)}           sub={`+${users.growth.daily} today`}       trend="up"  />
        <MetricCard label="DAU"              value={formatNumber(users.active.dau)}       sub={`WAU ${formatNumber(users.active.wau)}`}           />
        <MetricCard label="Day-30 Retention" value={formatPercent(users.retention.day30)} sub="30-day cohort"                        trend={users.retention.day30 > 20 ? 'up' : 'down'} />
        <MetricCard label="Churn Rate"       value={formatPercent(users.churn.rate)}      sub={users.churn.trend}                    trend={users.churn.rate < 5 ? 'up' : 'down'} />
      </div>

      {/* ── D1 / D7 / D30 retention row (previously missing) ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Retention Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Day 1',  value: users.retention.day1,  good: 40 },
              { label: 'Day 7',  value: users.retention.day7,  good: 25 },
              { label: 'Day 30', value: users.retention.day30, good: 15 },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn('font-medium tabular-nums', item.value >= item.good ? 'text-green-400' : 'text-yellow-400')}>
                    {formatPercent(item.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', item.value >= item.good ? 'bg-green-400' : 'bg-yellow-400')}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Interview metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Interviews"  value={formatNumber(interviews.total)}           sub={`+${interviews.today} today`}         trend="up" />
        <MetricCard label="Avg Score"         value={`${interviews.avgScore.toFixed(1)}/100`}  sub="completed sessions" />
        <MetricCard label="Completion Rate"   value={formatPercent(interviews.completionRate)} sub="of started sessions"                  trend={interviews.completionRate > 70 ? 'up' : 'down'} />
        <MetricCard label="Avg Duration"      value={`${Math.round(interviews.avgDuration)}m`} sub="per session" />
      </div>

      {/* ── Interview trends chart (previously missing) ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Interview Trend — Last 30 days</CardTitle></CardHeader>
        <CardContent>
          <InterviewTrendsChart data={interviews.trends.slice(-30)} />
        </CardContent>
      </Card>

      {/* ── Interview by type + difficulty (previously difficulty was missing) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Interviews by Type</CardTitle></CardHeader>
          <CardContent>
            <BarBreakdown data={interviews.byType} total={interviews.total} />
          </CardContent>
        </Card>

        {/* Previously missing */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Interviews by Difficulty</CardTitle></CardHeader>
          <CardContent>
            <BarBreakdown
              data={interviews.byDifficulty}
              total={interviews.total}
              colorMap={{ EASY: 'bg-green-400', MEDIUM: 'bg-yellow-400', HARD: 'bg-red-400' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Question bank + most attempted categories (previously missing) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Question Bank</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total',          value: questions.total,       color: 'text-foreground' },
                { label: 'AI Generated',   value: questions.aiGenerated, color: 'text-blue-400'   },
                { label: 'Pending Review', value: questions.pending,     color: 'text-yellow-400' },
                { label: 'Approved',       value: questions.approved,    color: 'text-green-400'  },
              ].map((item) => (
                <div key={item.label}>
                  <p className={cn('text-2xl font-bold tabular-nums', item.color)}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Previously missing */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Most Attempted Categories</CardTitle></CardHeader>
          <CardContent>
            {questions.mostAttempted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {questions.mostAttempted.slice(0, 6).map((item) => {
                  const max = questions.mostAttempted[0]?.attempts ?? 1
                  const pct = (item.attempts / max) * 100
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {item.category.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="font-medium tabular-nums">{formatNumber(item.attempts)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Engagement + top features (previously top features was missing) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Engagement (Last 30 days)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Avg Session',     value: `${Math.round(engagement.avgSessionDuration)}m` },
                { label: 'Questions Tried', value: formatNumber(engagement.questionsAttempted)      },
                { label: 'Hints Used',      value: formatNumber(Number(engagement.hintsUsed ?? 0))  },
                { label: 'Achievements',    value: formatNumber(engagement.achievementsUnlocked)    },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Previously missing */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Features Usage</CardTitle></CardHeader>
          <CardContent>
            {engagement.topFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {engagement.topFeatures.map((item) => {
                  const max = Math.max(...engagement.topFeatures.map((f) => f.usage), 1)
                  const pct = (item.usage / max) * 100
                  return (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {item.feature.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium tabular-nums">{formatNumber(item.usage)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── User role distribution (previously missing) ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Users by Role</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(users.byRole).map(([role, count]) => {
              const total = Object.values(users.byRole).reduce((a, b) => a + b, 0)
              const pct   = total > 0 ? (count / total) * 100 : 0
              const colorMap: Record<string, string> = {
                free:    'bg-muted-foreground/40 text-muted-foreground',
                premium: 'bg-primary/20 text-primary',
                admin:   'bg-purple-500/20 text-purple-400',
              }
              return (
                <div key={role} className="flex-1 min-w-24 text-center rounded-lg border border-border p-3">
                  <p className={cn('text-2xl font-bold tabular-nums', colorMap[role]?.split(' ')[1] ?? 'text-foreground')}>
                    {formatNumber(count)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>
                  <p className="text-xs text-muted-foreground/60">{formatPercent(pct)}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── User growth sparkline ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">New Users — Last 30 days</CardTitle></CardHeader>
        <CardContent>
          <MiniBarChart data={users.trends.slice(-30)} />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, trend,
}: {
  label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'flat'
}) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const color = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
          </div>
          {trend && <Icon className={cn('size-4 mt-1 shrink-0', color)} />}
        </div>
      </CardContent>
    </Card>
  )
}

function BarBreakdown({
  data, total, colorMap,
}: {
  data: Record<string, number>
  total: number
  colorMap?: Record<string, string>
}) {
  if (!Object.keys(data).length) {
    return <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
  }
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        const barColor = colorMap?.[key] ?? 'bg-primary'
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground capitalize">{key.replace('_', ' ').toLowerCase()}</span>
              <span className="font-medium tabular-nums">{formatNumber(count)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InterviewTrendsChart({
  data,
}: {
  data: Array<{ date: string; count: number; avgScore: number }>
}) {
  if (!data.length) return <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-16">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 bg-primary/60 rounded-sm hover:bg-primary transition-colors cursor-default"
            style={{ height: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
            title={`${d.date}: ${d.count} interviews · avg ${d.avgScore.toFixed(1)}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function MiniBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/60 rounded-sm hover:bg-primary transition-colors cursor-default"
          style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  )
}
