// src/pages/profile/AchievementsPage.tsx
import { Trophy, Lock, Star } from 'lucide-react';
import { useAchievements, useLeaderboard } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader, LoadingScreen } from '@/components/common';
import { formatRelative } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { UserAchievement } from '@/types';

function AchievementCard({ ua, unlocked }: { ua: UserAchievement; unlocked: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 transition-all',
        unlocked
          ? 'border-primary/20 bg-card'
          : 'border-border bg-secondary/10 opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-12 items-center justify-center rounded-xl text-2xl',
              unlocked ? 'bg-primary/10' : 'bg-secondary/50',
            )}
          >
            {unlocked ? ua.achievement.icon : <Lock className="size-5 text-muted-foreground" />}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{ua.achievement.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ua.achievement.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400 shrink-0">
          <Star className="size-3" />
          {ua.achievement.points}
        </div>
      </div>
      {unlocked && ua.unlockedAt && (
        <p className="text-xs text-muted-foreground">
          Unlocked {formatRelative(ua.unlockedAt)}
        </p>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const { data: achievementsData, isLoading: achLoading } = useAchievements();
  const { data: leaderboardData, isLoading: lbLoading } = useLeaderboard(10);

  if (achLoading) return <LoadingScreen message="Loading achievements…" />;

  const unlocked = achievementsData?.achievements ?? [];
  const totalPoints = unlocked.reduce((s, ua) => s + ua.achievement.points, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Achievements"
        description="Track your milestones and compete with others"
      />

      {/* Points banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6 pb-6 text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Trophy className="size-8 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {totalPoints}
          </p>
          <p className="text-sm text-muted-foreground">
            total points from {unlocked.length} achievement{unlocked.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Achievements grid */}
      {unlocked.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Trophy className="size-10 text-muted-foreground mx-auto opacity-30" />
            <p className="text-sm text-muted-foreground">
              No achievements yet. Complete interviews to unlock them!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Unlocked ({unlocked.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.map((ua) => (
              <AchievementCard key={ua.id} ua={ua} unlocked />
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-4 text-yellow-400" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lbLoading ? (
            <div className="flex justify-center py-6">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardData?.leaderboard?.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5"
                >
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-sm font-bold shrink-0',
                      entry.rank === 1
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : entry.rank === 2
                          ? 'bg-slate-400/20 text-slate-400'
                          : entry.rank === 3
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.problemsSolved} solved · {entry.currentStreak}🔥 streak
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground tabular-nums shrink-0">
                    {Math.round(entry.averageScore)}/100
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
