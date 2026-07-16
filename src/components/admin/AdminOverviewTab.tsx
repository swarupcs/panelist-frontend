// src/components/admin/AdminOverviewTab.tsx
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

      {/* User growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          value={formatNumber(users.total)}
          sub={`+${users.growth.daily} today`}
          trend="up"
        />
        <MetricCard
          label="DAU"
          value={formatNumber(users.active.dau)}
          sub={`WAU ${formatNumber(users.active.wau)}`}
        />
        <MetricCard
          label="Day-30 Retention"
          value={formatPercent(users.retention.day30)}
          sub="30-day cohort"
          trend={users.retention.day30 > 20 ? 'up' : 'down'}
        />
        <MetricCard
          label="Churn Rate"
          value={formatPercent(users.churn.rate)}
          sub={users.churn.trend}
          trend={users.churn.rate < 5 ? 'up' : 'down'}
        />
      </div>

      {/* Interview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Interviews"
          value={formatNumber(interviews.total)}
          sub={`+${interviews.today} today`}
          trend="up"
        />
        <MetricCard
          label="Avg Score"
          value={`${interviews.avgScore.toFixed(1)}/100`}
          sub="completed sessions"
        />
        <MetricCard
          label="Completion Rate"
          value={formatPercent(interviews.completionRate)}
          sub="of started sessions"
          trend={interviews.completionRate > 70 ? 'up' : 'down'}
        />
        <MetricCard
          label="Avg Duration"
          value={`${Math.round(interviews.avgDuration)}m`}
          sub="per session"
        />
      </div>

      {/* Interview by type + question stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Interviews by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(interviews.byType).map(([type, count]) => {
                const pct = interviews.total > 0
                  ? (count / interviews.total) * 100
                  : 0
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatNumber(count)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Bank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total',          value: questions.total,       color: 'text-foreground' },
                { label: 'AI Generated',   value: questions.aiGenerated, color: 'text-blue-400'   },
                { label: 'Pending Review', value: questions.pending,     color: 'text-yellow-400' },
                { label: 'Approved',       value: questions.approved,    color: 'text-green-400'  },
              ].map((item) => (
                <div key={item.label}>
                  <p className={cn('text-2xl font-bold tabular-nums', item.color)}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Engagement (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Avg Session',     value: `${Math.round(engagement.avgSessionDuration)}m` },
              { label: 'Questions Tried', value: formatNumber(engagement.questionsAttempted)      },
              { label: 'Hints Used',      value: formatNumber(Number(engagement.hintsUsed ?? 0))  },
              { label: 'Achievements',    value: formatNumber(engagement.achievementsUnlocked)    },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User growth sparkline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">New Users — Last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart data={users.trends.slice(-30)} />
        </CardContent>
      </Card>
    </div>
  )
}

// ── MetricCard ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'flat'
}) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'
      ? 'text-green-400'
      : trend === 'down'
        ? 'text-red-400'
        : 'text-muted-foreground'

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            {sub && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
            )}
          </div>
          {trend && (
            <TrendIcon className={cn('size-4 mt-1 shrink-0', trendColor)} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────

function MiniBarChart({
  data,
}: {
  data: Array<{ date: string; count: number }>
}) {
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
