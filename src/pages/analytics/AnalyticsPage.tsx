import { useState } from 'react'
import { BarChart3, TrendingUp, Target, Users, AlertTriangle } from 'lucide-react'
import { useAnalyticsDashboard, usePerformanceTrends, useSkillGaps } from '@/hooks/useAnalytics'
import { PageHeader, StatCard, LoadingScreen, ErrorState, SectionHeader } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'


import { Badge } from '@/components/ui/Badge'
import { formatScore, formatPercent, formatDate, getScoreBg, formatCategory } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'


function MiniBarChart({ data }: { data: { date: string; averageScore: number; interviewCount: number }[] }) {
  if (!data?.length) return <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
  const max = Math.max(...data.map(d => d.averageScore), 1)
  const recent = data.slice(-14)

  return (
    <div className="flex items-end gap-0.5 h-24 w-full">
      {recent.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${formatDate(d.date)}: ${formatScore(d.averageScore)}`}>
          <div
            className="w-full rounded-sm transition-all duration-300"
            style={{
              height: `${Math.max((d.averageScore / max) * 100, d.interviewCount > 0 ? 4 : 0)}%`,
              backgroundColor: d.averageScore >= 70 ? 'hsl(196 80% 55%)' : 'hsl(0 72% 51% / 0.7)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(30)
  const { data, isLoading, isError, refetch } = useAnalyticsDashboard()
  const { data: trends } = usePerformanceTrends(trendDays)
  const { data: skillGaps } = useSkillGaps()

  if (isLoading) return <LoadingScreen message="Loading analytics..." />
  if (isError) return <ErrorState message="Failed to load analytics" onRetry={refetch} />

  const stats = data?.statistics
  const comparative = data?.comparative

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Track your interview performance and progress"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Interviews" value={stats?.totalInterviews ?? 0} icon={BarChart3} />
        <StatCard title="Avg Score" value={stats ? formatScore(stats.averageScore) : '—'} icon={TrendingUp} />
        <StatCard title="Completion Rate" value={stats ? formatPercent(stats.completionRate) : '—'} icon={Target} />
        <StatCard
          title="Global Rank"
          value={comparative?.userRank ? `#${comparative.userRank}` : '—'}
          subtitle={comparative ? `Top ${comparative.percentile}%` : undefined}
          icon={Users}
        />
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="weak">Weak Areas</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Score Trends</CardTitle>
                <div className="flex gap-1">
                  {[7, 14, 30, 60].map(d => (
                    <button
                      key={d}
                      onClick={() => setTrendDays(d)}
                      className={cn(
                        'rounded px-2 py-0.5 text-xs transition-colors',
                        trendDays === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MiniBarChart data={trends || []} />
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-sm bg-primary" />
                  Score ≥ 70
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-sm bg-destructive/70" />
                  Score &lt; 70
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparative */}
          {comparative && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">vs Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Your score</span>
                      <span className="font-medium text-foreground">{formatScore(comparative.userAverageScore)}</span>
                    </div>
                    <Progress value={comparative.userAverageScore} className="h-2" indicatorClassName="bg-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Global average</span>
                      <span className="font-medium text-foreground">{formatScore(comparative.globalAverageScore)}</span>
                    </div>
                    <Progress value={comparative.globalAverageScore} className="h-2" indicatorClassName="bg-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You're ranked <span className="text-primary font-medium">#{comparative.userRank}</span> out of{' '}
                  <span className="text-foreground font-medium">{comparative.totalUsers.toLocaleString()}</span> users (top {comparative.percentile}%)
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-3">
          {!data?.topicPerformance?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Complete some interviews to see topic performance
              </CardContent>
            </Card>
          ) : (
            data.topicPerformance.map((topic) => (
              <div key={topic.topic} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">{formatCategory(topic.topic)}</p>
                    <Badge variant="outline" className="text-xs">{topic.totalQuestions}q</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatPercent(topic.successRate)} success</span>
                    <span className={cn('text-sm font-bold px-2 py-0.5 rounded', getScoreBg(topic.averageScore))}>
                      {formatScore(topic.averageScore)}
                    </span>
                  </div>
                </div>
                <Progress
                  value={topic.averageScore}
                  className="h-1.5"
                  indicatorClassName={topic.averageScore >= 70 ? 'bg-green-400' : topic.averageScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                />
              </div>
            ))
          )}
        </TabsContent>

        {/* Skill Gaps Tab */}
        <TabsContent value="gaps" className="space-y-3">
          {!skillGaps?.skillGaps?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Complete more interviews to identify skill gaps
              </CardContent>
            </Card>
          ) : (
            skillGaps.skillGaps.slice(0, 10).map((gap) => (
              <div key={gap.skill} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-foreground">{formatCategory(gap.skill)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {gap.currentLevel} → {gap.targetLevel}
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    Gap: {Math.round(gap.gap)}
                  </Badge>
                </div>
                <Progress
                  value={100 - gap.gap}
                  className="h-1.5 mt-3"
                  indicatorClassName="bg-destructive"
                />
              </div>
            ))
          )}
        </TabsContent>

        {/* Weak Areas Tab */}
        <TabsContent value="weak" className="space-y-3">
          {!data?.weakAreas?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                <AlertTriangle className="size-8 mx-auto mb-2 opacity-40" />
                No weak areas detected yet — great job!
              </CardContent>
            </Card>
          ) : (
            data.weakAreas.map((area) => (
              <div key={area.topic} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-sm text-foreground">{area.topic}</p>
                    <p className="text-xs text-muted-foreground">{area.category}</p>
                  </div>
                  <Badge variant="destructive">{area.failureCount}x failed</Badge>
                </div>
                {area.improvementSuggestions?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {area.improvementSuggestions.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-primary shrink-0">→</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
