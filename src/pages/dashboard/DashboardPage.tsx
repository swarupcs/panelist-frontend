// src/pages/dashboard/DashboardPage.tsx
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Code2,
  Layers,
  Users,
  Shuffle,
  TrendingUp,
  Target,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Flame,
  BookOpen,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  Trophy,
  Zap,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Clock,
  History,
  Monitor,
  Server,
  Cloud,
  Smartphone,
  Play,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStartInterview } from '@/hooks/useInterview';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import { useUserProgress } from '@/hooks/useProgress';
import { useAchievements, useGamificationStats } from '@/hooks/useGamification';
import { useDueReviews } from '@/hooks/useLearning';
import { DailyQuestsWidget } from '@/components/dashboard/DailyQuestsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreRing, MetricTile } from '@/components/common';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { StreakWidget } from '@/components/dashboard/StreakWidget';
import { DueReviewsWidget } from '@/components/dashboard/DueReviewsWidget';
import {
  formatScore,
  formatPercent,
  formatCategory,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatInterviewType,
  getScoreColor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatRelative,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';

// ── Quick action card ──────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bg: string;
  onClick: () => void;
}

function QuickAction({
  icon: Icon,
  label,
  description,
  color,
  bg,
  onClick,
}: QuickActionProps) {
  return (
    /* Icon beside the label rather than above it, matching the interview
       type tiles these four duplicate. Stacked they cost 284px of the page
       for four links. */
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        bg,
      )}
    >
      <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/40'>
        <Icon className={cn('size-4', color)} />
      </span>
      <span className='min-w-0'>
        <span className='block truncate text-sm font-semibold text-foreground'>
          {label}
        </span>
        <span className='block truncate text-xs text-muted-foreground'>
          {description}
        </span>
      </span>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const startInterview = useStartInterview();
  const { data: analytics, isLoading: analyticsLoading } =
    useAnalyticsDashboard();
  const { data: progress } = useUserProgress();
  const { data: achievements } = useAchievements();
  const { data: reviews } = useDueReviews(5);
  const { data: gamStats } = useGamificationStats();

  const stats = analytics?.statistics;
  const weakAreas = analytics?.weakAreas ?? [];
  const comparative = analytics?.comparative;
  const dueCount = reviews?.stats?.dueForReview ?? 0;
  const unlockedCount = achievements?.achievements?.length ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickStart = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const types: any[] = ['dsa', 'system_design', 'behavioral', 'frontend', 'backend', 'devops', 'mobile', 'mixed'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diffs: any[] = ['easy', 'medium', 'hard'];
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
    const randomDuration = [15, 30][Math.floor(Math.random() * 2)];

    sessionStorage.setItem('interview_isTimed', 'false');
    sessionStorage.setItem('interview_adaptiveMode', 'true');

    startInterview.mutate({
      type: randomType,
      difficulty: randomDiff,
      duration: randomDuration,
    });
  };

  const QUICK_ACTIONS = [
    {
      icon: Code2,
      label: 'DSA Interview',
      description: 'Algorithms & data structures',
      color: 'text-blue-400',
      bg: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10',
      onClick: () => navigate('/interview?type=dsa'),
    },
    {
      icon: Layers,
      label: 'System Design',
      description: 'Architecture & scalability',
      color: 'text-purple-400',
      bg: 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10',
      onClick: () => navigate('/interview?type=system_design'),
    },
    {
      icon: Users,
      label: 'Behavioral',
      description: 'STAR method & soft skills',
      color: 'text-green-400',
      bg: 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10',
      onClick: () => navigate('/interview?type=behavioral'),
    },
    {
      icon: Monitor,
      label: 'Frontend',
      description: 'React, CSS & Browser APIs',
      color: 'text-pink-400',
      bg: 'border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10',
      onClick: () => navigate('/interview?type=frontend'),
    },
    {
      icon: Server,
      label: 'Backend',
      description: 'APIs, DBs & Architecture',
      color: 'text-teal-400',
      bg: 'border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10',
      onClick: () => navigate('/interview?type=backend'),
    },
    {
      icon: Cloud,
      label: 'DevOps',
      description: 'CI/CD, Docker & Cloud',
      color: 'text-orange-400',
      bg: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10',
      onClick: () => navigate('/interview?type=devops'),
    },
    {
      icon: Smartphone,
      label: 'Mobile',
      description: 'iOS, Android & React Native',
      color: 'text-indigo-400',
      bg: 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10',
      onClick: () => navigate('/interview?type=mobile'),
    },
    {
      icon: Shuffle,
      label: 'Mixed',
      description: 'Combination of all types',
      color: 'text-yellow-400',
      bg: 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10',
      onClick: () => navigate('/interview?type=mixed'),
    },
    {
      icon: FileSearch,
      label: 'Review Resume',
      description: 'AI feedback for a role & JD',
      color: 'text-rose-400',
      bg: 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10',
      onClick: () => navigate('/resume-review'),
    },
  ];

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* ── Greeting ──
          The same gradient panel the interview and analytics pages open with,
          so the app has one way of starting a page rather than three. */}
      <section className='relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-6'>
        <div
          aria-hidden
          className='pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/20 blur-3xl'
        />
        <div
          aria-hidden
          className='pointer-events-none absolute -bottom-28 -left-16 size-56 rounded-full bg-accent/15 blur-3xl'
        />
        <div className='relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            {stats?.totalInterviews
              ? `You've completed ${stats.totalInterviews} interview${stats.totalInterviews !== 1 ? 's' : ''}. Keep it up!`
              : 'Ready to start practicing? Pick a session below.'}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {dueCount > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/learning')}
              className='gap-1.5'
            >
              <BookOpen className='size-3.5' />
              {dueCount} review{dueCount !== 1 ? 's' : ''} due
            </Button>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={handleQuickStart}
            disabled={startInterview.isPending}
            className='gap-1.5 border-primary/50 text-primary hover:bg-primary/10'
          >
            {startInterview.isPending ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Play className='size-3.5' />
            )}
            Quick Start
          </Button>
          <Button
            variant='gradient'
            size='sm'
            onClick={() => navigate('/interview')}
            className='gap-1.5'
          >
            <Brain className='size-3.5' />
            Setup Interview
          </Button>
        </div>
        </div>
      </section>

      {/* ── Stats row ──
          The same tile the analytics page uses. These are the same four
          figures, and they were styled differently on each page, so the same
          number looked like two different things depending where you saw it. */}
      {!analyticsLoading && stats && (
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          <MetricTile
            label='Readiness'
            value={analytics?.readinessScore !== undefined ? formatScore(analytics.readinessScore) : '—'}
            icon={Zap}
            valueClassName={analytics?.readinessScore !== undefined ? getScoreColor(analytics.readinessScore) : 'text-muted-foreground'}
          />
          <MetricTile
            label='Total interviews'
            value={stats.totalInterviews}
            icon={BarChart3}
          />
          <MetricTile
            label='Average score'
            value={formatScore(stats.averageScore)}
            icon={TrendingUp}
            valueClassName={getScoreColor(stats.averageScore)}
          />
          <MetricTile
            label='Completion rate'
            value={formatPercent(stats.completionRate)}
            icon={Target}
          />
          {comparative && (
            <MetricTile
              label='Global rank'
              value={`#${comparative.userRank}`}
              subtitle={`Top ${comparative.percentile}%`}
              icon={Trophy}
              accent
            />
          )}
        </div>
      )}

      {/* ── Placeholder stats when no data yet ── */}
      {!analyticsLoading && !stats?.totalInterviews && (
        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='py-8 text-center space-y-4'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-primary/10 p-4'>
                <Brain className='size-8 text-primary' />
              </div>
            </div>
            <div>
              <p className='font-semibold text-foreground'>No interviews yet</p>
              <p className='text-sm text-muted-foreground mt-1'>
                Complete your first interview to see your stats here.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant='outline'
                onClick={handleQuickStart}
                disabled={startInterview.isPending}
              >
                {startInterview.isPending ? (
                  <><Loader2 className='size-4 animate-spin mr-2' /> Starting...</>
                ) : (
                  <><Play className='size-4 mr-2' /> Quick Start</>
                )}
              </Button>
              <Button variant='gradient' onClick={() => navigate('/interview')}>
                Setup Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick actions ── */}
      <div>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
          Quick Start
        </h2>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {QUICK_ACTIONS.map((a) => (
            <QuickAction key={a.label} {...a} />
          ))}
        </div>
      </div>

      {/* ── Gamification Heatmap & Streak ── */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        {/* Sized by its content rather than pinned to 200px. A full year is
            seven rows of blocks plus month labels and a legend, which does not
            fit in that — the legend was being clipped by the card border. */}
        <div className='lg:col-span-3'>
          <ActivityHeatmap />
        </div>
        <div className='lg:col-span-1 h-[200px]'>
          <StreakWidget />
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {/* ── Left column (2/3) ── */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Weak areas */}
          {weakAreas.length > 0 && (
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <AlertTriangle className='size-4 text-yellow-400' />
                    Areas to Improve
                  </CardTitle>
                  <button
                    type='button'
                    onClick={() => navigate('/analytics')}
                    className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
                  >
                    See all <ChevronRight className='size-3' />
                  </button>
                </div>
              </CardHeader>
              <CardContent className='space-y-2'>
                {weakAreas.slice(0, 4).map((area) => (
                  <div
                    key={area.topic}
                    className='flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5'
                  >
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-foreground truncate'>
                        {area.topic}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatCategory(area.category)}
                      </p>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <Badge variant='destructive' className='text-xs'>
                        {area.failureCount}× failed
                      </Badge>
                      <button
                        type='button'
                        onClick={() =>
                          navigate(
                            `/interview?type=dsa&topic=${encodeURIComponent(area.category)}`,
                          )
                        }
                        className='rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors whitespace-nowrap'
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Spaced repetition due */}
          {dueCount > 0 && (
            <Card className='border-primary/20 bg-primary/5'>
              <CardContent className='pt-5 pb-5'>
                <div className='flex items-center gap-4'>
                  <div className='rounded-full bg-primary/10 p-3 shrink-0'>
                    <BookOpen className='size-5 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-foreground'>
                      {dueCount} card{dueCount !== 1 ? 's' : ''} due for review
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Spaced repetition keeps knowledge fresh — review now for
                      best retention.
                    </p>
                  </div>
                  <Button
                    variant='gradient'
                    size='sm'
                    onClick={() => navigate('/learning')}
                    className='shrink-0'
                  >
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Quests */}
          <DueReviewsWidget />
          <DailyQuestsWidget />

          {/* History shortcut */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <History className='size-4 text-muted-foreground' />
                  Recent Sessions
                </CardTitle>
                <button
                  type='button'
                  onClick={() => navigate('/interview/history')}
                  className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
                >
                  View all <ChevronRight className='size-3' />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-1'>
                {/* Trigger a refetch lazily — show placeholder rows */}
                <p className='text-xs text-muted-foreground py-4 text-center'>
                  Visit{' '}
                  <button
                    type='button'
                    onClick={() => navigate('/interview/history')}
                    className='text-primary underline-offset-2 hover:underline'
                  >
                    Interview History
                  </button>{' '}
                  to see all your past sessions and replays.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className='space-y-4'>
          {/* Score ring */}
          {stats && stats.totalInterviews > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Overall Score</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col items-center gap-4 pb-6'>
                <ScoreRing score={Math.round(stats.averageScore)} size={100} />
                <div className='text-center space-y-1'>
                  <p className='text-xs text-muted-foreground'>
                    {stats.completedInterviews} of {stats.totalInterviews}{' '}
                    completed
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatPercent(stats.completionRate, 0)} completion rate
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={() => navigate('/analytics')}
                >
                  Full Analytics
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {unlockedCount > 0 && (
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <Trophy className='size-4 text-yellow-400' />
                    Achievements
                  </CardTitle>
                  <button
                    type='button'
                    onClick={() => navigate('/achievements')}
                    className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
                  >
                    All <ChevronRight className='size-3' />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-2'>
                  {achievements?.achievements.slice(0, 6).map((ua) => (
                    <div
                      key={ua.id}
                      title={ua.achievement.title}
                      className='flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/30 p-2 min-w-[52px]'
                    >
                      <span className='text-lg leading-none'>
                        {ua.achievement.icon}
                      </span>
                      <span className='text-[10px] text-muted-foreground text-center leading-tight line-clamp-1 w-full'>
                        {ua.achievement.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning path progress */}
          {progress?.learningProgress && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Zap className='size-4 text-primary' />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground capitalize'>
                    Level:{' '}
                    {progress.learningProgress.currentLevel.toLowerCase()}
                  </span>
                  <span className='text-muted-foreground capitalize'>
                    Goal: {progress.learningProgress.goalLevel.toLowerCase()}
                  </span>
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {progress.learningProgress.topicsCompleted
                    .slice(0, 6)
                    .map((t) => (
                      <Badge key={t} variant='outline' className='text-xs'>
                        {formatCategory(t)}
                      </Badge>
                    ))}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={() => navigate('/learning')}
                >
                  View Learning Path
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Skill gaps teaser */}
          {weakAreas.length === 0 && !analyticsLoading && (
            <Card className='border-green-500/20 bg-green-500/5'>
              <CardContent className='py-5 text-center'>
                <Target className='size-8 text-green-400 mx-auto mb-2' />
                <p className='text-sm font-semibold text-foreground'>
                  No weak areas detected
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Keep practicing to see topic analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
