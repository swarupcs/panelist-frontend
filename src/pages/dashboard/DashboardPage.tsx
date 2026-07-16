import { Link } from 'react-router-dom'
import { Code2, Brain, Users, Target, TrendingUp, Clock, ChevronRight, Play } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAnalyticsDashboard } from '@/hooks/useAnalytics'
import { StatCard, LoadingScreen, ErrorState } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

import { formatScore, formatPercent, formatMinutes } from '@/utils/formatters'
import { Progress } from '../../components/ui/progress'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading, isError, refetch } = useAnalyticsDashboard()

  if (isLoading) return <LoadingScreen message="Loading your dashboard..." />
  if (isError) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />

  const stats = data?.statistics
  const comparative = data?.comparative

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ready for your next interview challenge?</p>
        </div>
        <Link to="/interview">
          <Button variant="gradient" size="lg" className="gap-2">
            <Play className="size-4" />
            Start Interview
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Interviews"
          value={stats?.totalInterviews ?? 0}
          icon={Brain}
          trend="up"
          trendValue={`${stats?.completedInterviews ?? 0} completed`}
        />
        <StatCard
          title="Average Score"
          value={stats ? formatScore(stats.averageScore) : '—'}
          icon={TrendingUp}
          trend={stats && stats.averageScore >= 70 ? 'up' : 'down'}
          trendValue={stats ? `${formatPercent(stats.completionRate)} completion` : undefined}
          iconClassName="bg-accent/10 text-accent-foreground"
        />
        <StatCard
          title="Your Rank"
          value={comparative?.userRank ? `#${comparative.userRank}` : '—'}
          icon={Users}
          subtitle={comparative ? `Top ${comparative.percentile}%` : undefined}
          iconClassName="bg-green-500/10 text-green-400"
        />
        <StatCard
          title="Time Practiced"
          value={stats ? formatMinutes(stats.totalTimeSpent) : '0m'}
          icon={Clock}
          iconClassName="bg-yellow-500/10 text-yellow-400"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weak Areas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Areas to Improve</CardTitle>
              <Link to="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!data?.weakAreas?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Target className="size-8 mx-auto mb-2 opacity-40" />
                No weak areas yet — keep practicing!
              </div>
            ) : (
              <div className="space-y-3">
                {data.weakAreas.slice(0, 5).map((area) => (
                  <div key={area.topic} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{area.topic}</p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {area.failureCount}x failed
                        </span>
                      </div>
                      <Progress value={Math.min(area.failureCount * 10, 100)} className="h-1.5" indicatorClassName="bg-destructive" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'DSA Interview', sub: '15-45 min', type: 'dsa', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'System Design', sub: '30-60 min', type: 'system_design', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Behavioral', sub: '15-30 min', type: 'behavioral', color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Mixed Session', sub: '45-90 min', type: 'mixed', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map((item) => (
              <Link
                key={item.type}
                to={`/interview?type=${item.type}`}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-secondary transition-colors group"
              >
                <div className={`flex size-8 items-center justify-center rounded-lg ${item.bg}`}>
                  <Code2 className={`size-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Topic Performance */}
      {data?.topicPerformance && data.topicPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Topic Performance</CardTitle>
              <Link to="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
                Full report <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.topicPerformance.slice(0, 6).map((topic) => (
                <div key={topic.topic} className="rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-foreground truncate">{topic.topic}</p>
                    <span className={`text-xs font-bold ${topic.averageScore >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatScore(topic.averageScore)}
                    </span>
                  </div>
                  <Progress
                    value={topic.averageScore}
                    className="h-1"
                    indicatorClassName={topic.averageScore >= 70 ? 'bg-green-400' : 'bg-red-400'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{topic.totalQuestions} questions</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
