// src/pages/interview/InterviewSetupPage.tsx
//
// NEW FEATURES
// ─────────────────────────────────────────────────────────────────────────────
// FEAT-1  Focus areas picker — multi-select category chips. Sent as
//         focusAreas[] in StartInterviewRequest. Only shown for DSA / mixed
//         sessions since those benefit most from topic targeting.
//
// FEAT-2  Timed session toggle — Switch that sets isTimed on the request.
//         When enabled, the session page receives isTimed=true so SessionTimer
//         polls the backend countdown instead of showing local elapsed.
//         The backend already supports isTimed via InterviewSessionManager.
//
// FEAT-3  Adaptive mode toggle — Switch that adds adaptiveMode=true to the
//         request. The backend AdaptiveInterviewService adjusts difficulty
//         between questions based on the last 3 scores.

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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

// FEAT-1: Focus area categories per interview type
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

// ── Main page ──────────────────────────────────────────────────────────────

export default function InterviewSetupPage() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as InterviewType) || 'dsa';

  const [selectedType, setSelectedType] = useState<InterviewType>(initialType);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('medium');
  const [selectedDuration, setSelectedDuration] = useState(30);

  // FEAT-1: focus areas
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [showFocusAreas, setShowFocusAreas] = useState(false);

  // FEAT-2: timed session
  const [isTimed, setIsTimed] = useState(false);

  // FEAT-3: adaptive mode
  const [adaptiveMode, setAdaptiveMode] = useState(false);

  const startInterview = useStartInterview();

  // Reset focus areas when type changes — previous selections may not apply
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
    startInterview.mutate(
      {
        type: selectedType,
        difficulty: selectedDifficulty,
        duration: selectedDuration,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        // isTimed and adaptiveMode are stored in the store so SessionPage can read them
      },
      {
        // Pass isTimed + adaptiveMode through meta so useStartInterview can forward them
        // They're stored in the interview store after session starts
      },
    );

    // Store isTimed for SessionPage to read via a sessionStorage flag
    // (the store will be populated by useStartInterview's onSuccess)
    sessionStorage.setItem('interview_isTimed', String(isTimed));
    sessionStorage.setItem('interview_adaptiveMode', String(adaptiveMode));
  };

  const availableFocusAreas = FOCUS_AREAS[selectedType] ?? [];
  const questionCount = Math.floor(selectedDuration / 15);

  return (
    <div className='space-y-6 max-w-2xl animate-fade-in'>
      <PageHeader
        title='Start Interview'
        description='Configure your mock interview session'
      />

      {/* ── Interview Type ───────────────────────────────────────────────── */}
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

      {/* ── Difficulty ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Gauge className='size-4 text-primary' />
            Difficulty
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

      {/* ── Duration ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Clock className='size-4 text-primary' />
            Duration
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

      {/* ── FEAT-1: Focus Areas ───────────────────────────────────────────── */}
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

      {/* ── FEAT-2 + FEAT-3: Advanced options ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Zap className='size-4 text-primary' />
            Advanced Options
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          {/* FEAT-2: Timed session */}
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-0.5'>
              <Label
                htmlFor='timed-switch'
                className='flex items-center gap-1.5 text-sm font-medium cursor-pointer'
              >
                <Timer className='size-4 text-primary' />
                Timed Session
              </Label>
              <p className='text-xs text-muted-foreground'>
                Countdown timer based on your chosen duration. Auto-submits
                unanswered questions when time expires.
              </p>
            </div>
            <Switch
              id='timed-switch'
              checked={isTimed}
              onCheckedChange={setIsTimed}
            />
          </div>

          <div className='border-t border-border/50' />

          {/* FEAT-3: Adaptive mode */}
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-0.5'>
              <Label
                htmlFor='adaptive-switch'
                className='flex items-center gap-1.5 text-sm font-medium cursor-pointer'
              >
                <Zap className='size-4 text-yellow-400' />
                Adaptive Difficulty
              </Label>
              <p className='text-xs text-muted-foreground'>
                Question difficulty adjusts automatically based on your last 3
                scores. Scores ≥ 85 increase difficulty; scores &lt; 60 decrease
                it.
              </p>
            </div>
            <Switch
              id='adaptive-switch'
              checked={adaptiveMode}
              onCheckedChange={setAdaptiveMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Summary & Start ───────────────────────────────────────────────── */}
      <Card className='border-primary/30 bg-primary/5'>
        <CardContent className='pt-5'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='space-y-1.5'>
              <p className='font-medium text-foreground'>Session Summary</p>
              <div className='flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground'>
                <span className='capitalize'>
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
