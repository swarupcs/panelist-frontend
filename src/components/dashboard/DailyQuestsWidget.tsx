import { useState } from 'react';
import { Swords, Loader2, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyQuests, useClaimQuestXP } from '@/hooks/useGamification';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import type { DailyQuest } from '@/types';

interface XPPopupState {
  show: boolean;
  amount: number;
}

interface QuestCardProps {
  quest: DailyQuest;
  onClaim: (questType: string) => void;
  isClaiming: boolean;
}

function QuestCard({ quest, onClaim, isClaiming }: QuestCardProps) {
  const progressPct = quest.target > 0 ? Math.min((quest.progress / quest.target) * 100, 100) : 0;
  const canClaim = quest.isCompleted && !quest.xpClaimed;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all duration-300',
        quest.xpClaimed
          ? 'border-green-500/30 bg-green-500/5 opacity-70'
          : quest.isCompleted
          ? 'border-primary/40 bg-primary/5 shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]'
          : 'border-border bg-secondary/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg',
            quest.xpClaimed
              ? 'bg-green-500/10'
              : quest.isCompleted
              ? 'bg-primary/10'
              : 'bg-secondary/50'
          )}
        >
          {quest.xpClaimed ? '✅' : quest.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">{quest.title}</p>
            <span
              className={cn(
                'shrink-0 text-xs font-bold px-2 py-0.5 rounded-full',
                quest.xpClaimed
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-primary/10 text-primary'
              )}
            >
              +{quest.xpReward} XP
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                quest.xpClaimed ? 'bg-green-500' : quest.isCompleted ? 'bg-primary' : 'bg-primary/40'
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {quest.progress}/{quest.target} {quest.target === 1 ? 'completed' : 'done'}
            </span>
            {quest.xpClaimed ? (
              <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Claimed
              </span>
            ) : canClaim ? (
              <Button
                size="sm"
                variant="gradient"
                className="h-5 text-[10px] px-2 py-0"
                onClick={() => onClaim(quest.type)}
                disabled={isClaiming}
              >
                {isClaiming ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim XP'}
              </Button>
            ) : (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Lock className="w-3 h-3" /> {Math.round(progressPct)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DailyQuestsWidget() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDailyQuests();
  const claim = useClaimQuestXP();
  const [xpPopup, setXpPopup] = useState<XPPopupState>({ show: false, amount: 0 });

  const quests = data?.quests ?? [];

  const handleClaim = async (questType: string) => {
    try {
      const result = await claim.mutateAsync(questType);
      setXpPopup({ show: true, amount: result.xpAwarded });
      setTimeout(() => setXpPopup({ show: false, amount: 0 }), 2500);
    } catch {
      // errors are handled via toast by the mutation
    }
  };

  if (!user) return null;

  return (
    <Card className="border-border bg-card shadow-sm relative overflow-hidden">
      {/* XP popup animation */}
      {xpPopup.show && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="animate-[fadeInUp_0.4s_ease-out_forwards] text-2xl font-extrabold text-primary drop-shadow-lg">
            +{xpPopup.amount} XP ✨
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          Daily Quests
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {quests.filter((q) => q.xpClaimed).length}/{quests.length} claimed
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-4 space-y-1">
            <Sparkles className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No quests yet. Start practicing!</p>
          </div>
        ) : (
          quests.map((quest) => (
            <QuestCard
              key={quest.type}
              quest={quest}
              onClaim={handleClaim}
              isClaiming={claim.isPending}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
