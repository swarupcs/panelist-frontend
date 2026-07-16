import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUserProgress } from '@/hooks/useProgress';

export function StreakWidget() {
  const { data: progress } = useUserProgress();
  
  const currentStreak = progress?.learningProgress?.currentStreak ?? 0;
  const longestStreak = progress?.learningProgress?.longestStreak ?? 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      <Card className="border-orange-500/30 bg-orange-500/5 shadow-sm flex-1">
        <CardContent className="p-4 flex items-center gap-4 h-full">
          <div className="rounded-full bg-orange-500/20 p-3 shrink-0 relative flex items-center justify-center">
            <Flame className="w-8 h-8 text-orange-500" />
            {currentStreak > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background">
                {currentStreak}
              </div>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
              {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-medium text-orange-600/80 mt-1 uppercase tracking-wider">
              Current Streak
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border bg-card shadow-sm flex-1">
        <CardContent className="p-4 flex items-center gap-4 h-full">
          <div className="rounded-full bg-primary/10 p-3 shrink-0 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
              {longestStreak} Day{longestStreak !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">
              Longest Streak
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
