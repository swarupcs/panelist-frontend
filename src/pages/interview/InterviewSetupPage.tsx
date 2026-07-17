import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Brain,
  Code2,
  Layers,
  Users,
  Shuffle,
  Clock,
  Gauge,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { PageHeader } from '@/components/common';
import { useStartInterview } from '@/hooks/useInterview';
import type { InterviewType, Difficulty } from '@/types';
import { cn } from '@/lib/cn';

const interviewTypes = [
  {
    value: 'dsa',
    label: 'DSA',
    description: 'Data structures & algorithms',
    icon: Code2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    value: 'system_design',
    label: 'System Design',
    description: 'Architecture & scalability',
    icon: Layers,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    value: 'behavioral',
    label: 'Behavioral',
    description: 'STAR method & soft skills',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Combination of all types',
    icon: Shuffle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
];

const difficulties = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Junior / entry level',
    color: 'text-green-400',
    border: 'border-green-500/30',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Mid-level engineer',
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Senior / lead engineer',
    color: 'text-red-400',
    border: 'border-red-500/30',
  },
];

const durations = [15, 30, 45, 60, 90];

const schema = z.object({
  type: z.enum(['dsa', 'system_design', 'behavioral', 'mixed'] as const),
  difficulty: z.enum(['easy', 'medium', 'hard'] as const),
  duration: z.number().min(15).max(120),
});
type FormData = z.infer<typeof schema>;

export default function InterviewSetupPage() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as InterviewType) || 'dsa';
  const [selectedType, setSelectedType] = useState<InterviewType>(initialType);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('medium');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const startInterview = useStartInterview();

  const handleStart = () => {
    startInterview.mutate({
      type: selectedType,
      difficulty: selectedDifficulty,
      duration: selectedDuration,
    });
  };

  return (
    <div className='space-y-6 max-w-2xl animate-fade-in'>
      <PageHeader
        title='Start Interview'
        description='Configure your mock interview session'
      />

      {/* Interview Type */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Brain className='size-4 text-primary' />
            Interview Type
          </CardTitle>
          <CardDescription>
            What type of interview do you want to practice?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-3'>
            {interviewTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value as InterviewType)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200',
                  selectedType === type.value
                    ? `${type.bg} border-2`
                    : 'border-border hover:bg-secondary',
                )}
              >
                <type.icon className={cn('size-5', type.color)} />
                <div>
                  <p className='font-medium text-sm text-foreground'>
                    {type.label}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {type.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Gauge className='size-4 text-primary' />
            Difficulty
          </CardTitle>
          <CardDescription>
            Choose the difficulty level for your session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-3'>
            {difficulties.map((diff) => (
              <button
                key={diff.value}
                onClick={() => setSelectedDifficulty(diff.value as Difficulty)}
                className={cn(
                  'flex flex-col gap-1 rounded-xl border p-4 text-center transition-all duration-200',
                  selectedDifficulty === diff.value
                    ? `bg-card border-2 ${diff.border}`
                    : 'border-border hover:bg-secondary',
                )}
              >
                <p className={cn('font-semibold text-sm', diff.color)}>
                  {diff.label}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {diff.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Clock className='size-4 text-primary' />
            Duration
          </CardTitle>
          <CardDescription>
            How long do you want to practice? (
            {Math.floor(selectedDuration / 15)} questions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {durations.map((dur) => (
              <button
                key={dur}
                onClick={() => setSelectedDuration(dur)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                  selectedDuration === dur
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {dur} min
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary & Start */}
      <Card className='border-primary/30 bg-primary/5'>
        <CardContent className='pt-5'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='space-y-1'>
              <p className='font-medium text-foreground'>Session Summary</p>
              <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                <span className='capitalize'>
                  {interviewTypes.find((t) => t.value === selectedType)?.label}
                </span>
                <span>•</span>
                <span className='capitalize'>{selectedDifficulty}</span>
                <span>•</span>
                <span>{selectedDuration} minutes</span>
                <span>•</span>
                <span>~{Math.floor(selectedDuration / 15)} questions</span>
              </div>
            </div>
            <Button
              variant='gradient'
              size='lg'
              onClick={handleStart}
              loading={startInterview.isPending}
              className='shrink-0'
            >
              Start Session
            </Button>
          </div>

          {startInterview.isError && (
            <p className='mt-3 text-sm text-destructive'>
              {(startInterview.error as any)?.response?.data?.error?.message ||
                'Failed to start interview'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
