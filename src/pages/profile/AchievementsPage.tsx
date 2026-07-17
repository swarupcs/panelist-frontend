import { useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { useAchievements, useLeaderboard } from '@/hooks/useAnalytics';
import {
  PageHeader,
  LoadingScreen,
  ErrorState,
  EmptyState,
} from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';

const ALL_LOCKED_HINTS = [
  { icon: '🎯', title: 'First Steps', desc: 'Complete your first interview' },
  { icon: '🔥', title: 'Week Streak', desc: '7-day practice streak' },
  { icon: '💯', title: 'Century Club', desc: 'Solve 100 problems' },
  { icon: '⭐', title: 'Perfectionist', desc: 'Get a perfect score' },
  { icon: '🏆', title: 'Interview Master', desc: 'Complete 100 interviews' },
  { icon: '👑', title: 'Consistency King', desc: '10 perfect scores' },
];

type Tab = 'achievements' | 'leaderboard';

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('achievements');

  const { data: achievements, isLoading, isError, refetch } = useAchievements();
  const { data: leaderboard } = useLeaderboard(20);
  const { user } = useAuthStore();

  if (isLoading) return <LoadingScreen message='Loading achievements...' />;
  if (isError)
    return (
      <ErrorState message='Failed to load achievements' onRetry={refetch} />
    );

  const unlockedCount = achievements?.length ?? 0;
  const lockedHints = ALL_LOCKED_HINTS.slice(unlockedCount).slice(0, 3);

  return (
    <div className='space-y-6 animate-fade-in'>
      <PageHeader
        title='Achievements'
        description='Your badges, milestones, and leaderboard ranking'
      />

      {/* Tab bar */}
      <div className='flex gap-1 border-b border-border'>
        <button
          onClick={() => setActiveTab('achievements')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'achievements'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Achievements
          {unlockedCount > 0 && (
            <span className='rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary'>
              {unlockedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'leaderboard'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Leaderboard
        </button>
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className='space-y-6'>
          {!achievements?.length ? (
            <EmptyState
              icon={Trophy}
              title='No achievements yet'
              description='Complete interviews and reach milestones to unlock achievements'
            />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {achievements.map((ua: any) => (
                <div
                  key={ua.id}
                  className='rounded-xl border border-border bg-card p-4 flex items-start gap-3 hover:border-primary/30 transition-colors'
                >
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-2xl'>
                    {ua.achievement.icon}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='font-semibold text-sm text-foreground'>
                        {ua.achievement.title}
                      </p>
                      <Badge variant='warning' className='text-xs shrink-0'>
                        +{ua.achievement.points}pts
                      </Badge>
                    </div>
                    <p className='text-xs text-muted-foreground mt-0.5 leading-relaxed'>
                      {ua.achievement.description}
                    </p>
                    {ua.unlockedAt && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        {formatRelative(ua.unlockedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {lockedHints.length > 0 && (
            <div>
              <p className='text-sm font-medium text-muted-foreground mb-3'>
                More to unlock
              </p>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                {lockedHints.map((item, i) => (
                  <div
                    key={i}
                    className='rounded-xl border border-border/50 bg-card/50 p-4 flex items-start gap-3 opacity-50'
                  >
                    <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl grayscale'>
                      {item.icon}
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <p className='font-semibold text-sm text-muted-foreground'>
                          {item.title}
                        </p>
                        <Lock className='size-3 text-muted-foreground shrink-0' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <Trophy className='size-4 text-yellow-400' />
              Global Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!leaderboard?.length ? (
              <EmptyState
                icon={Trophy}
                title='No rankings yet'
                description='Complete interviews to appear on the leaderboard'
              />
            ) : (
              <div className='space-y-1'>
                {leaderboard.map((entry: any, index: number) => {
                  const isCurrentUser = entry.userId === user?.id;
                  const medal =
                    index === 0
                      ? '🥇'
                      : index === 1
                        ? '🥈'
                        : index === 2
                          ? '🥉'
                          : null;

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                        isCurrentUser
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-secondary',
                      )}
                    >
                      <div className='w-8 text-center shrink-0'>
                        {medal ? (
                          <span className='text-lg'>{medal}</span>
                        ) : (
                          <span className='text-sm font-bold text-muted-foreground'>
                            #{entry.rank ?? index + 1}
                          </span>
                        )}
                      </div>

                      <Avatar className='size-8 shrink-0'>
                        <AvatarImage src={entry.profilePicture ?? undefined} />
                        <AvatarFallback className='text-xs'>
                          {entry.name?.slice(0, 2).toUpperCase() ?? '??'}
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1 min-w-0'>
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            isCurrentUser ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {entry.name}
                          {isCurrentUser && (
                            <span className='ml-1 text-xs text-muted-foreground'>
                              (you)
                            </span>
                          )}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          🔥 {entry.currentStreak}d streak
                        </p>
                      </div>

                      <div className='text-right shrink-0'>
                        <p className='text-sm font-bold text-foreground'>
                          {entry.problemsSolved}
                        </p>
                        <p className='text-xs text-muted-foreground'>solved</p>
                      </div>

                      <div className='text-right shrink-0 hidden sm:block'>
                        <p
                          className={cn(
                            'text-sm font-bold',
                            entry.averageScore >= 70
                              ? 'text-green-400'
                              : 'text-yellow-400',
                          )}
                        >
                          {Math.round(entry.averageScore)}
                        </p>
                        <p className='text-xs text-muted-foreground'>avg</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
