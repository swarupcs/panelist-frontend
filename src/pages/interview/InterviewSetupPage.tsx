// src/pages/interview/InterviewSetupPage.tsx
// FIXED: Replaced shadcn Switch+Label (unstyled/missing) with a self-contained
// custom toggle that works reliably in dark mode without extra dependencies.

import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Code2,
  Layers,
  Users,
  Shuffle,
  Clock,
  Brain,
  Monitor,
  Server,
  Cloud,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Gauge,
  Zap,
  Timer,
  FileText,
  Repeat,
  AlertCircle,
  Sparkles,
  Check,
  ArrowRight,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStartInterview } from '@/hooks/useInterview';
import type { InterviewType, Difficulty } from '@/types';
import { cn } from '@/lib/cn';
import { ResumePicker } from '@/components/interview/ResumePicker';
import { apiErrorMessage } from '@/lib/api-error';

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
    value: 'frontend',
    label: 'Frontend',
    description: 'React, CSS & Browser APIs',
    icon: Monitor,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    value: 'backend',
    label: 'Backend',
    description: 'APIs, DBs & Architecture',
    icon: Server,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
  },
  {
    value: 'devops',
    label: 'DevOps',
    description: 'CI/CD, Docker & Cloud',
    icon: Cloud,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    value: 'mobile',
    label: 'Mobile',
    description: 'iOS, Android & React Native',
    icon: Smartphone,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
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
  {
    value: 'resume_deep_dive',
    label: 'Resume Deep Dive',
    description: 'Questions tailored to your resume',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    value: 'srs_review',
    label: 'SRS Weak Area Review',
    description: 'Targeted practice for topics you previously struggled with',
    icon: Repeat,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
] as const;

const DIFFICULTIES = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Junior / entry level',
    color: 'text-green-400',
    bar: 'bg-green-400',
    ring: 'ring-green-500/40',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Mid-level engineer',
    color: 'text-yellow-400',
    bar: 'bg-yellow-400',
    ring: 'ring-yellow-500/40',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Senior / lead engineer',
    color: 'text-red-400',
    bar: 'bg-red-400',
    ring: 'ring-red-500/40',
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
  frontend: [
    { value: 'HTML_CSS', label: 'HTML/CSS' },
    { value: 'JAVASCRIPT_ES6', label: 'JavaScript' },
    { value: 'REACT', label: 'React' },
    { value: 'WEB_PERFORMANCE', label: 'Web Performance' },
    { value: 'ACCESSIBILITY', label: 'Accessibility' },
    { value: 'BROWSER_APIS', label: 'Browser APIs' },
  ],
  backend: [
    { value: 'REST_API_DESIGN', label: 'REST API Design' },
    { value: 'DATABASE_DESIGN', label: 'Database Design' },
    { value: 'AUTHENTICATION', label: 'Authentication' },
    { value: 'CACHING', label: 'Caching' },
    { value: 'MICROSERVICES', label: 'Microservices' },
    { value: 'SQL', label: 'SQL' },
  ],
  devops: [
    { value: 'CI_CD', label: 'CI/CD' },
    { value: 'DOCKER', label: 'Docker' },
    { value: 'KUBERNETES', label: 'Kubernetes' },
    { value: 'SECURITY', label: 'Security' },
  ],
  mobile: [
    { value: 'REACT', label: 'React Native' }, // Assuming React works for RN
  ],
};

// ── Layout primitives ─────────────────────────────────────────────

/**
 * One step of the form.
 *
 * The page used to be seven Cards of identical weight stacked in a single
 * narrow column, which read as a list of equally important decisions when in
 * practice only the first two matter to most people. The icon plate and the
 * lighter surface give each step a head without making it shout.
 */
function Section({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-sm sm:p-6',
        className,
      )}
    >
      <div className='mb-4 flex items-start gap-3'>
        <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Icon className='size-4' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='text-sm font-semibold text-foreground'>{title}</h2>
          {description && (
            <p className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/** One line of the summary rail. */
function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-baseline justify-between gap-3 py-2.5'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 truncate text-right text-sm font-medium text-foreground'>
        {value}
      </dd>
    </div>
  );
}

/** A non-default mode, shown only when it is actually on. */
function ModeChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {label}
    </span>
  );
}

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
  // The resume review page hands the text over in navigation state rather than
  // the query string: a resume is long and personal, and query strings end up
  // in history, server logs and Referer headers.
  const location = useLocation();
  const carried = (location.state ?? {}) as { resumeText?: string; type?: InterviewType };

  const initialType = carried.type || (searchParams.get('type') as InterviewType) || 'dsa';

  const [selectedType, setSelectedType] = useState<InterviewType>(initialType);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('medium');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [showFocusAreas, setShowFocusAreas] = useState(false);
  const [isTimed, setIsTimed] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [stressMode, setStressMode] = useState(false);
  const [aiPersona, setAiPersona] = useState<'supportive' | 'strict' | 'default'>('default');
  const [resumeText, setResumeText] = useState(carried.resumeText ?? '');

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

  const handleQuickStart = () => {
    const types: InterviewType[] = ['dsa', 'system_design', 'behavioral', 'frontend', 'backend', 'devops', 'mobile', 'mixed'];
    const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
    const randomDuration = [15, 30][Math.floor(Math.random() * 2)];

    sessionStorage.setItem('interview_isTimed', 'false');
    sessionStorage.setItem('interview_adaptiveMode', 'true');

    startInterview.mutate({
      type: randomType,
      difficulty: randomDiff,
      duration: randomDuration,
    });
  };

  const handleStart = () => {
    sessionStorage.setItem('interview_isTimed', String(isTimed));
    sessionStorage.setItem('interview_adaptiveMode', String(adaptiveMode));
    startInterview.mutate({
      type: selectedType,
      difficulty: selectedDifficulty,
      duration: selectedDuration,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      resumeText: selectedType === 'resume_deep_dive' ? resumeText : undefined,
      aiPersona: aiPersona,
      stressMode: stressMode,
      // Previously only written to sessionStorage, which drove a badge in the
      // header and nothing else — the server never learned the session was
      // meant to adapt.
      adaptiveMode: adaptiveMode,
    });
  };

  const availableFocusAreas = FOCUS_AREAS[selectedType] ?? [];
  const questionCount = Math.floor(selectedDuration / 15);

  const selectedTypeMeta = INTERVIEW_TYPES.find((t) => t.value === selectedType);

  return (
    <div className='animate-fade-in mx-auto max-w-6xl pb-12'>
      {/* ── Hero ── */}
      <section className='relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 sm:p-8'>
        <div
          aria-hidden
          className='pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/20 blur-3xl'
        />
        <div
          aria-hidden
          className='pointer-events-none absolute -bottom-28 -left-16 size-56 rounded-full bg-accent/15 blur-3xl'
        />

        <div className='relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary'>
              <Sparkles className='size-3' />
              Mock interview
            </span>
            <h1 className='mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
              Start an interview
            </h1>
            <p className='mt-2 max-w-md text-sm leading-relaxed text-muted-foreground'>
              Choose a track and a difficulty. Everything below already has a
              sensible default, so two clicks is enough.
            </p>
          </div>

          <Button
            variant='outline'
            onClick={handleQuickStart}
            disabled={startInterview.isPending}
            className='w-full shrink-0 gap-2 border-primary/30 bg-background/60 text-primary backdrop-blur hover:bg-primary/10 sm:w-auto'
          >
            {startInterview.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Zap className='size-4 text-yellow-400' />
            )}
            Surprise me
          </Button>
        </div>
      </section>

      {/* The form on the left, the decision on the right. The summary rail is
          sticky because Start used to sit at the bottom of a very long scroll,
          so reviewing your choices and acting on them were never possible at
          the same moment. */}
      <div className='mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_336px]'>
        <div className='space-y-6'>
          {/* ── Interview type ── */}
          <Section
            icon={Brain}
            title='Interview type'
            description='What do you want to be asked about?'
          >
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {INTERVIEW_TYPES.map((type) => {
                const active = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    type='button'
                    aria-pressed={active}
                    onClick={() => handleTypeChange(type.value as InterviewType)}
                    className={cn(
                      'group relative flex flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-all duration-200',
                      'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? `${type.bg} border-transparent shadow-md ring-2 ring-primary/50`
                        : 'border-border/70 bg-background/40 hover:border-border',
                    )}
                  >
                    {active && (
                      <Check className='absolute right-3 top-3 size-4 text-primary' />
                    )}
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg transition-colors',
                        active ? 'bg-background/60' : 'bg-secondary/60',
                      )}
                    >
                      <type.icon className={cn('size-5', type.color)} />
                    </span>
                    <span className='block'>
                      <span className='block text-sm font-medium text-foreground'>
                        {type.label}
                      </span>
                      <span className='mt-0.5 block text-xs leading-snug text-muted-foreground'>
                        {type.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Resume context ── */}
          {selectedType === 'resume_deep_dive' && (
            <Section
              icon={FileText}
              title='Resume context'
              description={
                <>
                  Upload your resume and we&rsquo;ll read it &mdash; questions are
                  built from your own projects and the tools you actually used.
                </>
              }
              className='border-blue-500/30'
            >
              {/* The review page is where this flow is meant to start. Offered
                  rather than enforced: someone who just wants to practise
                  should not have to sit through an analysis first. */}
              {!carried.resumeText && (
                <Link
                  to='/interview/resume'
                  className='mb-3 inline-flex items-center gap-2 text-xs text-primary hover:underline'
                >
                  <FileSearch className='size-3.5' />
                  Review your resume first
                </Link>
              )}

              {carried.resumeText ? (
                <div className='flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3'>
                  <FileText className='mt-0.5 size-4 shrink-0 text-primary' />
                  <div className='min-w-0'>
                    <p className='text-sm font-medium'>
                      Using the resume you just reviewed
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {carried.resumeText.length.toLocaleString()} characters of
                      context
                    </p>
                  </div>
                </div>
              ) : (
                <ResumePicker onTextChange={setResumeText} />
              )}
            </Section>
          )}

          {/* ── Difficulty ── */}
          <Section
            icon={Gauge}
            title='Difficulty'
            description={
              adaptiveMode
                ? 'Starting point only — this adapts as you go.'
                : 'Roughly the seniority you are interviewing for.'
            }
          >
            <div className='grid grid-cols-3 gap-3'>
              {DIFFICULTIES.map((diff, index) => {
                const active = selectedDifficulty === diff.value;
                return (
                  <button
                    key={diff.value}
                    type='button'
                    aria-pressed={active}
                    onClick={() => setSelectedDifficulty(diff.value as Difficulty)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-all duration-200',
                      'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? `border-transparent bg-secondary/40 shadow-md ring-2 ${diff.ring}`
                        : 'border-border/70 hover:bg-secondary/30',
                    )}
                  >
                    {/* Three bars filled to the level. The ordering is the
                        point, and colour alone does not convey it. */}
                    <span className='flex gap-1' aria-hidden>
                      {[0, 1, 2].map((bar) => (
                        <span
                          key={bar}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            bar <= index ? diff.bar : 'bg-border',
                          )}
                        />
                      ))}
                    </span>
                    <p className={cn('mt-2.5 text-sm font-semibold', diff.color)}>
                      {diff.label}
                    </p>
                    <p className='text-xs leading-snug text-muted-foreground'>
                      {diff.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Duration ── */}
          <Section icon={Clock} title='Duration' description='How long do you have?'>
            <div className='flex flex-wrap gap-2'>
              {DURATIONS.map((dur) => (
                <button
                  key={dur}
                  type='button'
                  aria-pressed={selectedDuration === dur}
                  onClick={() => setSelectedDuration(dur)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selectedDuration === dur
                      ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                      : 'border-border/70 text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  )}
                >
                  {dur} min
                </button>
              ))}
            </div>
            <p className='mt-3 text-xs text-muted-foreground'>
              About {questionCount} question{questionCount !== 1 ? 's' : ''} at this
              length.
            </p>
          </Section>

          {/* ── Focus areas ── */}
          {availableFocusAreas.length > 0 && (
            <section className='rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm'>
              <button
                type='button'
                onClick={() => setShowFocusAreas((o) => !o)}
                aria-expanded={showFocusAreas}
                className='flex w-full items-start gap-3 p-5 text-left sm:p-6'
              >
                <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <Brain className='size-4' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-foreground'>
                      Focus areas
                    </span>
                    {focusAreas.length > 0 && (
                      <span className='rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary'>
                        {focusAreas.length} selected
                      </span>
                    )}
                  </span>
                  <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                    {focusAreas.length === 0
                      ? 'Optional — every topic is in play if you skip this'
                      : focusAreas
                          .map(
                            (a) =>
                              availableFocusAreas.find((f) => f.value === a)
                                ?.label ?? a,
                          )
                          .join(', ')}
                  </span>
                </span>
                {showFocusAreas ? (
                  <ChevronUp className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                ) : (
                  <ChevronDown className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                )}
              </button>

              {showFocusAreas && (
                <div className='border-t border-border/50 p-5 pt-4 sm:p-6 sm:pt-4'>
                  <div className='flex flex-wrap gap-2'>
                    {availableFocusAreas.map((area) => {
                      const active = focusAreas.includes(area.value);
                      return (
                        <button
                          key={area.value}
                          type='button'
                          aria-pressed={active}
                          onClick={() => toggleFocusArea(area.value)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                            active
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border/70 text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
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
                      className='mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground'
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Interviewer ── */}
          <Section
            icon={Users}
            title='Your interviewer'
            description='How the AI conducts the session.'
          >
            <div className='flex flex-wrap gap-2'>
              {(['default', 'supportive', 'strict'] as const).map((persona) => (
                <button
                  key={persona}
                  type='button'
                  aria-pressed={aiPersona === persona}
                  onClick={() => setAiPersona(persona)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    aiPersona === persona
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/70 text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  )}
                >
                  {persona === 'default'
                    ? 'Balanced'
                    : persona === 'strict'
                      ? 'FAANG manager'
                      : 'Supportive mentor'}
                </button>
              ))}
            </div>

            <div className='mt-5 border-t border-border/50 pt-5'>
              <AdvancedOption
                id='stress-toggle'
                icon={AlertCircle}
                iconColor='text-destructive'
                title='Stress mode'
                description='The AI may change requirements or add constraints mid-problem, to see how you adapt under pressure.'
                checked={stressMode}
                onChange={setStressMode}
              />
            </div>
          </Section>

          {/* ── Session rules ── */}
          <Section
            icon={Zap}
            title='Session rules'
            description='Off by default — turn on what you want to practise against.'
          >
            <div className='space-y-5'>
              <AdvancedOption
                id='timed-toggle'
                icon={Timer}
                iconColor='text-primary'
                title='Timed session'
                description='A countdown for your chosen duration. Unanswered questions submit themselves when it runs out.'
                checked={isTimed}
                onChange={setIsTimed}
              />

              <div className='border-t border-border/50' />

              <AdvancedOption
                id='adaptive-toggle'
                icon={Zap}
                iconColor='text-yellow-400'
                title='Adaptive difficulty'
                description='Difficulty follows your last 3 scores. 85 or above moves it up, under 60 moves it down.'
                checked={adaptiveMode}
                onChange={setAdaptiveMode}
              />
            </div>
          </Section>
        </div>

        {/* ── Summary rail ── */}
        <aside className='lg:sticky lg:top-6'>
          <div className='overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 to-card shadow-lg shadow-primary/5'>
            <div className='border-b border-border/50 px-5 py-4'>
              <p className='text-sm font-semibold text-foreground'>Session summary</p>
              <p className='text-xs text-muted-foreground'>
                Worth a glance before you begin
              </p>
            </div>

            <dl className='divide-y divide-border/40 px-5'>
              <SummaryRow label='Track' value={selectedTypeMeta?.label} />
              <SummaryRow
                label='Difficulty'
                value={<span className='capitalize'>{selectedDifficulty}</span>}
              />
              <SummaryRow
                label='Length'
                value={`${selectedDuration} min · ~${questionCount} question${questionCount !== 1 ? 's' : ''}`}
              />
              {focusAreas.length > 0 && (
                <SummaryRow
                  label='Focus'
                  value={`${focusAreas.length} area${focusAreas.length !== 1 ? 's' : ''}`}
                />
              )}
            </dl>

            {/* Only departures from the default are listed. A row reading
                "Stress mode: off" is noise dressed up as information. */}
            {(isTimed || adaptiveMode || stressMode || aiPersona !== 'default') && (
              <div className='flex flex-wrap gap-1.5 border-t border-border/40 px-5 py-3'>
                {isTimed && (
                  <ModeChip
                    label='Timed'
                    className='border-primary/30 bg-primary/10 text-primary'
                  />
                )}
                {adaptiveMode && (
                  <ModeChip
                    label='Adaptive'
                    className='border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  />
                )}
                {stressMode && (
                  <ModeChip
                    label='Stress mode'
                    className='border-destructive/30 bg-destructive/10 text-destructive'
                  />
                )}
                {aiPersona !== 'default' && (
                  <ModeChip
                    label={
                      aiPersona === 'strict' ? 'FAANG manager' : 'Supportive mentor'
                    }
                    className='border-primary/30 bg-primary/10 text-primary'
                  />
                )}
              </div>
            )}

            <div className='p-5 pt-4'>
              <Button
                variant='gradient'
                size='lg'
                onClick={handleStart}
                loading={startInterview.isPending}
                className='w-full gap-2'
              >
                Start session
                <ArrowRight className='size-4' />
              </Button>

              {startInterview.isError && (
                <p className='mt-3 text-sm text-destructive'>
                  {apiErrorMessage(startInterview.error, 'Failed to start interview')}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
