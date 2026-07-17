// src/pages/interview/InterviewSetupPage.tsx
// FIXED: Replaced shadcn Switch+Label (unstyled/missing) with a self-contained
// custom toggle that works reliably in dark mode without extra dependencies.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Brain,
  Code2,
  Layers,
  Users,
  Shuffle,
  Clock,
  Gauge,
  Zap,
  Timer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { PageHeader } from '@/components/common';
import { useStartInterview } from '@/hooks/useInterview';
import type { InterviewType, Difficulty } from '@/types';
import { cn } from '@/lib/cn';

// ── Static data ────────────────────────────────────────────────────────────

const INTERVIEW_TYPES = [
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
] as const;

const DIFFICULTIES = [
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
] as const;

const DURATIONS = [15, 30, 45, 60, 90];

const FOCUS_AREAS: Record<string, { value: string; label: string }[]> = {
  dsa: [
    { value: 'ARRAYS', label: 'Arrays' },
    { value: 'STRINGS', label: 'Strings' },
    { value: 'LINKED_LISTS', label: 'Linked Lists' },
    { value: 'TREES', label: 'Trees' },
    { value: 'GRAPHS', label: 'Graphs' },
    { value: 'DYNAMIC_PROGRAMMING', label: 'Dynamic Programming' },
    { value: 'SORTING', label: 'Sorting' },
    { value: 'SEARCHING', label: 'Searching' },
    { value: 'HASH_TABLES', label: 'Hash Tables' },
    { value: 'STACKS_QUEUES', label: 'Stacks & Queues' },
    { value: 'RECURSION', label: 'Recursion' },
    { value: 'BACKTRACKING', label: 'Backtracking' },
    { value: 'GREEDY', label: 'Greedy' },
    { value: 'BIT_MANIPULATION', label: 'Bit Manipulation' },
  ],
  mixed: [
    { value: 'ARRAYS', label: 'Arrays' },
    { value: 'DYNAMIC_PROGRAMMING', label: 'Dynamic Programming' },
    { value: 'TREES', label: 'Trees' },
    { value: 'GRAPHS', label: 'Graphs' },
    { value: 'SCALABILITY', label: 'Scalability' },
    { value: 'DATABASE_DESIGN', label: 'Database Design' },
    { value: 'LEADERSHIP', label: 'Leadership' },
    { value: 'TEAMWORK', label: 'Teamwork' },
  ],
  system_design: [
    { value: 'SCALABILITY', label: 'Scalability' },
    { value: 'DISTRIBUTED_SYSTEMS', label: 'Distributed Systems' },
    { value: 'CACHING', label: 'Caching' },
    { value: 'DATABASE_DESIGN', label: 'Database Design' },
    { value: 'LOAD_BALANCING', label: 'Load Balancing' },
    { value: 'CAP_THEOREM', label: 'CAP Theorem' },
  ],
  behavioral: [
    { value: 'LEADERSHIP', label: 'Leadership' },
    { value: 'TEAMWORK', label: 'Teamwork' },
    { value: 'CONFLICT_RESOLUTION', label: 'Conflict Resolution' },
    { value: 'COMMUNICATION', label: 'Communication' },
  ],
};

// ── Custom Toggle ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  id?: string;
}) {
  return (
    <button
      type='button'
      id={id}
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-secondary',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ── Advanced option row ────────────────────────────────────────────────────

function AdvancedOption({
  icon: Icon,
  iconColor,
  title,
  description,
  checked,
  onChange,
  id,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  id: string;
}) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-start gap-3 flex-1'>
        <div
          className={cn(
            'rounded-lg p-2 shrink-0 mt-0.5',
            checked ? 'bg-primary/10' : 'bg-secondary/50',
          )}
        >
          <Icon
            className={cn(
              'size-4',
              checked ? iconColor : 'text-muted-foreground',
            )}
          />
        </div>
        <div>
          <label
            htmlFor={id}
            className='text-sm font-semibold text-foreground cursor-pointer select-none'
          >
            {title}
          </label>
          <p className='text-xs text-muted-foreground mt-0.5 leading-relaxed'>
            {description}
          </p>
        </div>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InterviewSetupPage() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as InterviewType) || 'dsa';

  const [selectedType, setSelectedType] = useState<InterviewType>(initialType);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('medium');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [showFocusAreas, setShowFocusAreas] = useState(false);
  const [isTimed, setIsTimed] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);

  const startInterview = useStartInterview();

  const handleTypeChange = (type: InterviewType) => {
    setSelectedType(type);
    setFocusAreas([]);
    setShowFocusAreas(false);
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleStart = () => {
    sessionStorage.setItem('interview_isTimed', String(isTimed));
    sessionStorage.setItem('interview_adaptiveMode', String(adaptiveMode));
    startInterview.mutate({
      type: selectedType,
      difficulty: selectedDifficulty,
      duration: selectedDuration,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
    });
  };

  const availableFocusAreas = FOCUS_AREAS[selectedType] ?? [];
  const questionCount = Math.floor(selectedDuration / 15);

  return (
    <div className='space-y-6 max-w-2xl animate-fade-in'>
      <PageHeader
        title='Start Interview'
        description='Configure your mock interview session'
      />

      {/* ── Interview Type ── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Brain className='size-4 text-primary' /> Interview Type
          </CardTitle>
          <CardDescription>
            What type of interview do you want to practice?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-3'>
            {INTERVIEW_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value as InterviewType)}
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

      {/* ── Difficulty ── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Gauge className='size-4 text-primary' /> Difficulty
          </CardTitle>
          <CardDescription>
            Choose the difficulty level for your session
            {adaptiveMode && (
              <span className='ml-1 text-primary'>
                (starting difficulty — adapts as you go)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-3'>
            {DIFFICULTIES.map((diff) => (
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

      {/* ── Duration ── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Clock className='size-4 text-primary' /> Duration
          </CardTitle>
          <CardDescription>
            How long do you want to practice? (~{questionCount} question
            {questionCount !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {DURATIONS.map((dur) => (
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

      {/* ── Focus Areas ── */}
      {availableFocusAreas.length > 0 && (
        <Card>
          <CardHeader>
            <button
              type='button'
              onClick={() => setShowFocusAreas((o) => !o)}
              className='flex w-full items-center justify-between text-left'
            >
              <div>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Brain className='size-4 text-primary' />
                  Focus Areas
                  {focusAreas.length > 0 && (
                    <span className='ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary'>
                      {focusAreas.length} selected
                    </span>
                  )}
                </CardTitle>
                <CardDescription className='mt-0.5'>
                  {focusAreas.length === 0
                    ? 'Optional — target specific topics (all topics if none selected)'
                    : `Focusing on: ${focusAreas.map((a) => availableFocusAreas.find((f) => f.value === a)?.label ?? a).join(', ')}`}
                </CardDescription>
              </div>
              {showFocusAreas ? (
                <ChevronUp className='size-4 text-muted-foreground shrink-0' />
              ) : (
                <ChevronDown className='size-4 text-muted-foreground shrink-0' />
              )}
            </button>
          </CardHeader>
          {showFocusAreas && (
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {availableFocusAreas.map((area) => {
                  const active = focusAreas.includes(area.value);
                  return (
                    <button
                      key={area.value}
                      type='button'
                      onClick={() => toggleFocusArea(area.value)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      {area.label}
                    </button>
                  );
                })}
              </div>
              {focusAreas.length > 0 && (
                <button
                  type='button'
                  onClick={() => setFocusAreas([])}
                  className='mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors'
                >
                  Clear selection
                </button>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── Advanced Options ── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Zap className='size-4 text-primary' /> Advanced Options
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          <AdvancedOption
            id='timed-toggle'
            icon={Timer}
            iconColor='text-primary'
            title='Timed Session'
            description='Countdown timer based on your chosen duration. Auto-submits unanswered questions when time expires.'
            checked={isTimed}
            onChange={setIsTimed}
          />

          <div className='border-t border-border/50' />

          <AdvancedOption
            id='adaptive-toggle'
            icon={Zap}
            iconColor='text-yellow-400'
            title='Adaptive Difficulty'
            description='Question difficulty adjusts automatically based on your last 3 scores. Scores ≥ 85 increase difficulty; scores < 60 decrease it.'
            checked={adaptiveMode}
            onChange={setAdaptiveMode}
          />
        </CardContent>
      </Card>

      {/* ── Summary & Start ── */}
      <Card className='border-primary/30 bg-primary/5'>
        <CardContent className='pt-5'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='space-y-1.5'>
              <p className='font-medium text-foreground'>Session Summary</p>
              <div className='flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground'>
                <span>
                  {INTERVIEW_TYPES.find((t) => t.value === selectedType)?.label}
                </span>
                <span>·</span>
                <span className='capitalize'>{selectedDifficulty}</span>
                <span>·</span>
                <span>{selectedDuration} min</span>
                <span>·</span>
                <span>~{questionCount} questions</span>
                {isTimed && (
                  <>
                    <span>·</span>
                    <span className='text-primary'>Timed</span>
                  </>
                )}
                {adaptiveMode && (
                  <>
                    <span>·</span>
                    <span className='text-yellow-400'>Adaptive</span>
                  </>
                )}
                {focusAreas.length > 0 && (
                  <>
                    <span>·</span>
                    <span className='text-primary'>
                      {focusAreas.length} focus area
                      {focusAreas.length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
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
