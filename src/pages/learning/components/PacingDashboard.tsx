import { useState } from 'react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import type { LearningPath } from '@/types';
import { useUpdateTargetDate } from '@/hooks/useLearning';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';

interface PacingDashboardProps {
  path: LearningPath;
}

export function PacingDashboard({ path }: PacingDashboardProps) {
  const { mutate: updateTargetDate, isPending } = useUpdateTargetDate();
  const [dateStr, setDateStr] = useState<string>('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const totalTopics = path.phases.reduce((sum, phase) => sum + phase.topics.length, 0);
  const completedTopics = path.phases.reduce(
    (sum, phase) => sum + phase.topics.filter((t) => t.isCompleted).length,
    0
  );
  
  const handleSaveDate = () => {
    if (!dateStr) return;
    updateTargetDate(
      { pathId: path.id, targetDate: new Date(dateStr).toISOString() },
      {
        onSuccess: () => {
          setIsPopoverOpen(false);
        }
      }
    );
  };

  const clearTargetDate = () => {
    updateTargetDate(
      { pathId: path.id, targetDate: null },
      {
        onSuccess: () => {
          setDateStr('');
          setIsPopoverOpen(false);
        }
      }
    );
  };

  // Render Setup Banner
  if (!path.targetDate) {
    return (
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Set Your Interview Date</h3>
              <p className="text-sm text-muted-foreground">
                We'll dynamically pace your learning and tell you exactly what you need to complete each day.
              </p>
            </div>
          </div>
          
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button>Set Target Date</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Target Interview Date</h4>
                <Input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]} 
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
                <Button className="w-full" onClick={handleSaveDate} disabled={!dateStr || isPending}>
                  {isPending ? 'Saving...' : 'Save Date'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    );
  }

  // Calculate Pacing
  const targetDate = new Date(path.targetDate);
  const startDate = new Date(path.createdAt);
  const now = new Date();
  
  const totalDays = Math.max(1, differenceInDays(targetDate, startDate));
  const daysPassed = Math.max(0, differenceInDays(now, startDate));
  const daysRemaining = differenceInDays(targetDate, now);
  
  const expectedPace = totalTopics / totalDays;
  const expectedCompletedTopicsByNow = Math.floor(expectedPace * daysPassed);
  
  const topicsRemaining = totalTopics - completedTopics;
  const dailyTarget = daysRemaining > 0 ? Math.ceil(topicsRemaining / daysRemaining) : topicsRemaining;

  let status: 'ahead' | 'track' | 'behind' = 'track';
  if (completedTopics < expectedCompletedTopicsByNow) {
    status = 'behind';
  } else if (completedTopics > expectedCompletedTopicsByNow + 1) {
    status = 'ahead';
  }

  const isCompleted = topicsRemaining === 0;

  return (
    <Card className={cn(
      "mb-8 border transition-all duration-300",
      isCompleted ? "border-green-500/50 bg-green-500/5" :
      status === 'behind' ? "border-orange-500/50 bg-orange-500/5" : 
      status === 'ahead' ? "border-blue-500/50 bg-blue-500/5" :
      "border-primary/50 bg-primary/5"
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-full",
              isCompleted ? "bg-green-500/20 text-green-500" :
              status === 'behind' ? "bg-orange-500/20 text-orange-500" : 
              status === 'ahead' ? "bg-blue-500/20 text-blue-500" :
              "bg-primary/20 text-primary"
            )}>
              {isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
               status === 'behind' ? <AlertCircle className="w-6 h-6" /> :
               status === 'ahead' ? <TrendingUp className="w-6 h-6" /> :
               <Clock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {isCompleted ? "You're Ready!" :
                 status === 'behind' ? "Falling Behind" :
                 status === 'ahead' ? "Ahead of Schedule" :
                 "On Track"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isCompleted ? (
                  "You've completed all topics before your interview date!"
                ) : status === 'behind' ? (
                  `Complete ${Math.max(1, expectedCompletedTopicsByNow - completedTopics + dailyTarget)} topics today to get back on track.`
                ) : status === 'ahead' ? (
                  "Great work! You have extra buffer time."
                ) : (
                  `Complete ${dailyTarget} topic${dailyTarget !== 1 ? 's' : ''} today to stay on pace.`
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Date</p>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="text-sm font-medium hover:text-primary transition-colors hover:underline">
                    {format(targetDate, 'MMM d, yyyy')}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Update Target Date</h4>
                    <Input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]} 
                      value={dateStr || new Date(targetDate).toISOString().split('T')[0]}
                      onChange={(e) => setDateStr(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={clearTargetDate} disabled={isPending}>
                        Clear
                      </Button>
                      <Button className="flex-1" onClick={handleSaveDate} disabled={!dateStr || isPending}>
                        Update
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-px h-8 bg-border hidden md:block" />

            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
              <p className={cn(
                "text-sm font-bold",
                daysRemaining < 0 ? "text-red-500" :
                daysRemaining <= 7 ? "text-orange-500" : "text-foreground"
              )}>
                {daysRemaining < 0 ? 'Past Due' :
                 daysRemaining === 0 ? 'Today' :
                 `${daysRemaining} Days`}
              </p>
            </div>

            <div className="w-px h-8 bg-border hidden md:block" />

            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Topics</p>
              <p className="text-sm font-bold text-foreground">
                {completedTopics} / {totalTopics}
              </p>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
