import type { LearningTopic } from '@/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Lock,
  Star,
  BookOpen,
  Play,
  Flame,
  LayoutGrid,
  Database,
  Code2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SkillTreeNodeProps {
  topic: LearningTopic;
  isLocked: boolean;
  onOpenCrashCourse: (topic: LearningTopic) => void;
}

export function SkillTreeNode({
  topic,
  isLocked,
  onOpenCrashCourse,
}: SkillTreeNodeProps) {
  const navigate = useNavigate();

  const getIcon = () => {
    if (isLocked) return <Lock className='size-6' />;
    if (topic.isCompleted) return <CheckCircle2 className='size-6' />;
    
    // Default icons based on category (a simplified map)
    const cat = topic.category.toLowerCase();
    if (cat.includes('system')) return <Database className='size-6' />;
    if (cat.includes('frontend')) return <LayoutGrid className='size-6' />;
    if (cat.includes('behavioral')) return <Star className='size-6' />;
    return <Code2 className='size-6' />;
  };

  const getColors = () => {
    if (topic.isCompleted) {
      return 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105';
    }
    if (topic.isRemedial) {
      return 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-105';
    }
    if (isLocked) {
      return 'bg-secondary/40 border-muted text-muted-foreground opacity-60';
    }
    // Current / Unlocked
    return 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.4)] ring-2 ring-primary/20 hover:scale-110';
  };

  const progress =
    topic.questionsToSolve > 0
      ? Math.min((topic.questionsSolved / topic.questionsToSolve) * 100, 100)
      : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={isLocked}
          className={cn(
            'group relative flex size-16 md:size-20 items-center justify-center rounded-full border-4 transition-all duration-300',
            getColors()
          )}
        >
          {getIcon()}
          
          {/* Progress Ring Background */}
          {!topic.isCompleted && !isLocked && (
            <svg className="absolute inset-0 size-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                className="stroke-primary/20"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                className="stroke-primary transition-all duration-1000"
                strokeWidth="4"
                fill="none"
                strokeDasharray="289"
                strokeDashoffset={289 - (289 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Topic Title Tooltip (always visible below on large screens) */}
          <div className="absolute top-full mt-2 w-32 text-center">
            <span className={cn(
              "text-xs md:text-sm font-semibold transition-colors line-clamp-2",
              isLocked ? "text-muted-foreground" : "text-foreground"
            )}>
              {topic.title}
            </span>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className='w-72 p-4 animate-in zoom-in-95' sideOffset={10}>
        <div className='space-y-3'>
          <div>
            <div className='flex items-center justify-between mb-1'>
              <h4 className='font-bold text-foreground leading-tight'>
                {topic.title}
              </h4>
              {topic.isRemedial && (
                <Badge variant='outline' className='text-[10px] text-orange-400 border-orange-400'>
                  Remedial
                </Badge>
              )}
            </div>
            <p className='text-xs text-muted-foreground line-clamp-2'>
              {topic.description || 'Master this topic to progress further in your path.'}
            </p>
          </div>

          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>Practice Progress</span>
            <span className='font-medium text-primary'>
              {topic.questionsSolved}/{topic.questionsToSolve}
            </span>
          </div>
          <div className='h-1.5 w-full bg-secondary rounded-full overflow-hidden'>
            <div
              className='h-full bg-primary transition-all'
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className='flex gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              className='flex-1 gap-1 h-8 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
              onClick={() => onOpenCrashCourse(topic)}
            >
              <BookOpen className='size-3' /> Study
            </Button>
            <Button
              size='sm'
              className='flex-1 gap-1 h-8'
              onClick={() => navigate(`/interview?type=dsa&topic=${encodeURIComponent(topic.category)}`)}
            >
              <Play className='size-3' /> Practice
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
