// src/pages/gamification/GamificationPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Swords, Users, Flame, Star, Lock,
  ChevronRight, Loader2, Zap, Crown, Medal, Award,
  Shield, TrendingUp
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useAchievements, useLeaderboard, useDailyQuests,
  useClaimQuestXP, useGamificationStats,
} from '@/hooks/useGamification';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import type { DailyQuest } from '@/types';

// ── XP Level colour helper ──────────────────────────────────────────────────
const XP_TIERS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];

function levelColor(level: number) {
  if (level >= 10) return 'text-yellow-400';
  if (level >= 7)  return 'text-purple-400';
  if (level >= 5)  return 'text-blue-400';
  if (level >= 3)  return 'text-green-400';
  return 'text-muted-foreground';
}

function levelBadgeClass(level: number) {
  if (level >= 10) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  if (level >= 7)  return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
  if (level >= 5)  return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  if (level >= 3)  return 'bg-green-500/10 border-green-500/30 text-green-400';
  return 'bg-secondary/50 border-border text-muted-foreground';
}

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

// ── Quest card ──────────────────────────────────────────────────────────────
interface QuestCardProps {
  quest: DailyQuest;
  onClaim: (type: string) => void;
  isClaiming: boolean;
}

function QuestCard({ quest, onClaim, isClaiming }: QuestCardProps) {
  const pct = quest.target > 0 ? Math.min((quest.progress / quest.target) * 100, 100) : 0;
  const canClaim = quest.isCompleted && !quest.xpClaimed;

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-md',
      quest.xpClaimed ? 'border-green-500/30 bg-green-500/5 opacity-80' :
      quest.isCompleted ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.08)]' :
      'border-border'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
            quest.xpClaimed ? 'bg-green-500/10' :
            quest.isCompleted ? 'bg-primary/10' : 'bg-secondary/50'
          )}>
            {quest.xpClaimed ? '✅' : quest.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="font-semibold text-foreground">{quest.title}</p>
                <p className="text-sm text-muted-foreground">{quest.description}</p>
              </div>
              <Badge variant="outline" className={cn(
                'shrink-0 text-xs font-bold',
                quest.xpClaimed ? 'border-green-500/30 text-green-600' : 'border-primary/30 text-primary'
              )}>
                +{quest.xpReward} XP
              </Badge>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{quest.progress} / {quest.target}</span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    quest.xpClaimed ? 'bg-green-500' :
                    quest.isCompleted ? 'bg-gradient-to-r from-primary to-blue-500' :
                    'bg-primary/40'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {canClaim && (
              <Button
                variant="gradient"
                size="sm"
                className="mt-3 w-full gap-2"
                onClick={() => onClaim(quest.type)}
                disabled={isClaiming}
              >
                {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Claim {quest.xpReward} XP
              </Button>
            )}
            {quest.xpClaimed && (
              <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                ✓ XP collected for today
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────

type Tab = 'quests' | 'achievements' | 'leaderboard';

// ── Main page ───────────────────────────────────────────────────────────────

export default function GamificationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('quests');
  const [xpToast, setXpToast] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });

  const { data: questData, isLoading: questsLoading } = useDailyQuests();
  const { data: achData, isLoading: achLoading } = useAchievements();
  const { data: lbData, isLoading: lbLoading } = useLeaderboard(20);
  const { data: statsData } = useGamificationStats();
  const claim = useClaimQuestXP();

  const quests = questData?.quests ?? [];
  const achievements = achData?.achievements ?? [];
  const leaderboard = lbData?.leaderboard ?? [];
  const stats = statsData?.stats;

  const handleClaim = async (questType: string) => {
    try {
      const res = await claim.mutateAsync(questType);
      setXpToast({ show: true, amount: res.xpAwarded });
      setTimeout(() => setXpToast({ show: false, amount: 0 }), 3000);
    } catch { /* handled */ }
  };

  const xpPct = stats
    ? Math.min((stats.xpThisLevel / Math.max(stats.xpNeededForNextLevel, 1)) * 100, 100)
    : 0;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'quests',       label: 'Daily Quests',  icon: Swords },
    { key: 'achievements', label: 'Achievements',   icon: Trophy },
    { key: 'leaderboard',  label: 'Leaderboard',    icon: Users  },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* XP toast */}
      {xpToast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="animate-[fadeInUp_0.5s_ease-out_forwards] bg-background border border-primary/40 shadow-2xl shadow-primary/20 rounded-2xl px-6 py-3 flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-xl font-extrabold text-primary">+{xpToast.amount} XP</p>
              <p className="text-xs text-muted-foreground">Quest Reward Collected!</p>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Achievements & Quests" description="Earn XP, complete daily challenges, and climb the leaderboard" />

      {/* XP Level Card */}
      {stats && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              <div className={cn(
                'w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0',
                levelBadgeClass(stats.level)
              )}>
                <Shield className="w-5 h-5 mb-0.5" />
                <span className="text-lg font-extrabold leading-none">{stats.level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-foreground text-lg">Level {stats.level}</p>
                  <span className="text-sm text-muted-foreground">{stats.xp.toLocaleString()} XP total</span>
                </div>
                <div className="h-2.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{stats.xpThisLevel} XP this level</span>
                  {stats.xpToNextLevel > 0
                    ? <span>{stats.xpToNextLevel} XP to Level {stats.level + 1}</span>
                    : <span className="text-yellow-400">Max Level! 🏆</span>
                  }
                </div>
              </div>
              <div className="shrink-0 text-right space-y-0.5">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-bold">{stats.currentStreak}d</span>
                </div>
                <p className="text-[10px] text-muted-foreground">streak</p>
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-bold">{stats.achievementsUnlocked}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Daily Quests tab ── */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          {questsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Complete quests to earn XP and level up. Quests reset daily at midnight.
                </p>
                <Badge variant="outline" className="text-xs">
                  {quests.filter(q => q.xpClaimed).length}/{quests.length} claimed
                </Badge>
              </div>
              {quests.map((q) => (
                <QuestCard
                  key={q.type}
                  quest={q}
                  onClaim={handleClaim}
                  isClaiming={claim.isPending}
                />
              ))}
              {quests.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <Swords className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="font-semibold text-foreground">No quests available</p>
                    <p className="text-sm text-muted-foreground">Start a practice session to unlock your daily quests.</p>
                    <Button variant="gradient" onClick={() => navigate('/interview')}>
                      Start Interview
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Achievements tab ── */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked. Keep going to discover more!
              </p>

              {achievements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <Trophy className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="font-semibold text-foreground">No achievements yet</p>
                    <p className="text-sm text-muted-foreground">Complete interviews and reach milestones to earn badges.</p>
                    <Button variant="gradient" onClick={() => navigate('/interview')}>
                      Start Practicing
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {achievements.map((ua) => (
                    <Card
                      key={ua.id}
                      className="border-border hover:border-primary/30 transition-colors group"
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto group-hover:scale-110 transition-transform">
                          {ua.achievement.icon || '🏆'}
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{ua.achievement.title}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{ua.achievement.description}</p>
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                          +{ua.achievement.points} pts
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(ua.unlockedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Locked silhouettes */}
                  {Array.from({ length: Math.max(0, 6 - achievements.length) }).map((_, i) => (
                    <Card
                      key={`locked-${i}`}
                      className="border-border/50 opacity-40"
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">???</p>
                        <p className="text-xs text-muted-foreground">Keep practicing to unlock</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Leaderboard tab ── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          {lbLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <Users className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="font-semibold text-foreground">Leaderboard is empty</p>
                <p className="text-sm text-muted-foreground">Be the first to solve problems and claim the top spot!</p>
              </CardContent>
            </Card>
          ) : (
            leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user?.id;
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border p-3 transition-all',
                    isCurrentUser
                      ? 'border-primary/40 bg-primary/5'
                      : entry.rank <= 3
                      ? 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/8'
                      : 'border-border bg-card hover:bg-secondary/30'
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center shrink-0">
                    {rankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    {entry.profilePicture ? (
                      <img
                        src={entry.profilePicture}
                        alt={entry.name}
                        className="w-9 h-9 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {entry.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {entry.name}
                        {isCurrentUser && <span className="ml-1 text-primary text-xs">(You)</span>}
                      </p>
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full border', levelBadgeClass(entry.level ?? 1))}>
                        Lv.{entry.level ?? 1}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.problemsSolved} problems solved
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-bold">{(entry.xp ?? 0).toLocaleString()} XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs">{entry.currentStreak}d</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
