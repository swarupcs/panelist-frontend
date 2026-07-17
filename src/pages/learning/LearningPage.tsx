// src/pages/learning/LearningPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Zap,
  ChevronRight,
  Loader2,
  Star,
  RefreshCw,
  Calendar,
  Target,
  Lock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useLearningPath,
  useGeneratePath,
  useCompleteTopic,
  useRecommendations,
  useGenerateRecommendations,
  useCompleteRecommendation,
  useDueReviews,
  useRecordReview,
} from '@/hooks/useLearning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, EmptyState } from '@/components/common';
import { formatCategory, formatDate, formatPercent } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { LearningTopic, SpacedRepetitionItem } from '@/types';

// ── Role / Level selector (shown when no path exists) ─────────────────────

const ROLES = [
  { value: 'DSA_SPECIALIST', label: 'DSA Specialist' },
  { value: 'FRONTEND_DEVELOPER', label: 'Frontend Developer' },
  { value: 'BACKEND_DEVELOPER', label: 'Backend Developer' },
  { value: 'FULLSTACK_DEVELOPER', label: 'Full Stack Developer' },
  { value: 'MOBILE_DEVELOPER', label: 'Mobile Developer' },
  { value: 'DEVOPS_ENGINEER', label: 'DevOps Engineer' },
];

const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

function PathGenerator() {
  const [role, setRole] = useState('FULLSTACK_DEVELOPER');
  const [level, setLevel] = useState('BEGINNER');
  const [hours, setHours] = useState(10);
  const generate = useGeneratePath();

  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Zap className='size-4 text-primary' />
          Generate Your Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Target Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50'
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Current Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50'
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='space-y-1.5'>
          <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
            Weekly Study Hours: {hours}h
          </label>
          <input
            type='range'
            min={5}
            max={40}
            step={5}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className='w-full accent-primary'
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>5h</span>
            <span>40h</span>
          </div>
        </div>

        <Button
          variant='gradient'
          onClick={() =>
            generate.mutate({
              targetRole: role,
              currentLevel: level,
              weeklyHours: hours,
            })
          }
          loading={generate.isPending}
          className='w-full'
        >
          Generate Path
        </Button>

        {generate.isError && (
          <p className='text-sm text-destructive text-center'>
            Failed to generate path. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Topic row ──────────────────────────────────────────────────────────────

function TopicRow({
  topic,
  phaseCompleted,
}: {
  topic: LearningTopic;
  phaseCompleted: boolean;
}) {
  const completeTopic = useCompleteTopic();
  const navigate = useNavigate();
  const progress =
    topic.questionsToSolve > 0
      ? Math.min((topic.questionsSolved / topic.questionsToSolve) * 100, 100)
      : 0;

  const isLocked = !topic.isCompleted && phaseCompleted;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 space-y-2',
        topic.isCompleted
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-border bg-secondary/20',
        isLocked && 'opacity-50',
      )}
    >
      <div className='flex items-center gap-3'>
        {topic.isCompleted ? (
          <CheckCircle2 className='size-4 text-green-400 shrink-0' />
        ) : isLocked ? (
          <Lock className='size-4 text-muted-foreground shrink-0' />
        ) : (
          <Circle className='size-4 text-muted-foreground shrink-0' />
        )}

        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-sm font-medium text-foreground'>{topic.title}</p>
            <Badge variant='outline' className='text-xs'>
              {formatCategory(topic.category)}
            </Badge>
          </div>
          {topic.description && (
            <p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>
              {topic.description}
            </p>
          )}
        </div>

        <div className='shrink-0 flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {topic.questionsSolved}/{topic.questionsToSolve}q
          </span>
          {!topic.isCompleted && !isLocked && (
            <div className='flex gap-1'>
              <button
                type='button'
                onClick={() =>
                  navigate(
                    `/interview?type=dsa&topic=${encodeURIComponent(topic.category)}`,
                  )
                }
                className='rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
              >
                Practice
              </button>
              <button
                type='button'
                onClick={() => completeTopic.mutate(topic.id)}
                disabled={completeTopic.isPending}
                className='rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors disabled:opacity-50'
              >
                {completeTopic.isPending ? (
                  <Loader2 className='size-3 animate-spin' />
                ) : (
                  'Mark done'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!topic.isCompleted && topic.questionsToSolve > 0 && (
        <div className='ml-7 h-1 rounded-full bg-border overflow-hidden'>
          <div
            className='h-full rounded-full bg-primary transition-all duration-500'
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Spaced repetition review card ──────────────────────────────────────────

function ReviewCard({ item }: { item: SpacedRepetitionItem }) {
  const recordReview = useRecordReview();
  const [revealed, setRevealed] = useState(false);

  const QUALITY_LABELS = [
    {
      q: 0,
      label: 'Blackout',
      color: 'text-red-400 border-red-500/30 hover:bg-red-500/10',
    },
    {
      q: 1,
      label: 'Wrong',
      color: 'text-red-400 border-red-500/30 hover:bg-red-500/10',
    },
    {
      q: 2,
      label: 'Hard',
      color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10',
    },
    {
      q: 3,
      label: 'OK',
      color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10',
    },
    {
      q: 4,
      label: 'Good',
      color: 'text-green-400 border-green-500/30 hover:bg-green-500/10',
    },
    {
      q: 5,
      label: 'Perfect',
      color: 'text-green-400 border-green-500/30 hover:bg-green-500/10',
    },
  ];

  return (
    <Card>
      <CardContent className='pt-5 space-y-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <Badge variant='outline' className='text-xs mb-2'>
              {formatCategory(item.category)}
            </Badge>
            <p className='text-sm text-muted-foreground'>
              Question ID:{' '}
              <code className='text-xs'>{item.questionId.slice(0, 8)}…</code>
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              Interval: {item.interval} day{item.interval !== 1 ? 's' : ''} ·
              Rep #{item.repetitions}
            </p>
          </div>
          {!revealed && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setRevealed(true)}
            >
              Reveal Answer
            </Button>
          )}
        </div>

        {revealed && (
          <div className='space-y-3 border-t border-border/50 pt-3'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              How well did you recall?
            </p>
            <div className='flex flex-wrap gap-2'>
              {QUALITY_LABELS.map(({ q, label, color }) => (
                <button
                  key={q}
                  type='button'
                  onClick={() =>
                    recordReview.mutate({ itemId: item.id, quality: q })
                  }
                  disabled={recordReview.isPending}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                    color,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recommendations panel ──────────────────────────────────────────────────

function RecommendationsPanel() {
  const { data, isLoading } = useRecommendations();
  const generate = useGenerateRecommendations();
  const complete = useCompleteRecommendation();
  const navigate = useNavigate();

  const active =
    data?.recommendations?.filter((r) => !r.isCompleted && !r.isDismissed) ??
    [];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
          Recommendations
        </h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => generate.mutate()}
          loading={generate.isPending}
          className='gap-1.5 h-7 text-xs'
        >
          <RefreshCw className='size-3' /> Refresh
        </Button>
      </div>

      {isLoading && (
        <div className='flex justify-center py-6'>
          <Loader2 className='size-5 animate-spin text-primary' />
        </div>
      )}

      {!isLoading && active.length === 0 && (
        <div className='rounded-xl border border-border bg-secondary/20 py-6 text-center text-sm text-muted-foreground'>
          No recommendations yet.{' '}
          <button
            type='button'
            onClick={() => generate.mutate()}
            className='text-primary underline-offset-2 hover:underline'
          >
            Generate some
          </button>
        </div>
      )}

      {active.slice(0, 4).map((rec) => (
        <div
          key={rec.id}
          className='flex items-start gap-3 rounded-xl border border-border bg-card p-3'
        >
          <div className='rounded-lg bg-primary/10 p-1.5 shrink-0 mt-0.5'>
            <Target className='size-3.5 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-foreground'>{rec.title}</p>
            <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2'>
              {rec.description}
            </p>
            {rec.expiresAt && (
              <p className='text-xs text-muted-foreground mt-1 flex items-center gap-1'>
                <Calendar className='size-3' />
                Expires {formatDate(rec.expiresAt)}
              </p>
            )}
          </div>
          <div className='flex flex-col gap-1 shrink-0'>
            {rec.category && (
              <button
                type='button'
                onClick={() =>
                  navigate(
                    `/interview?type=dsa&topic=${encodeURIComponent(rec.category!)}`,
                  )
                }
                className='flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
              >
                Practice <ChevronRight className='size-3' />
              </button>
            )}
            <button
              type='button'
              onClick={() => complete.mutate(rec.id)}
              disabled={complete.isPending}
              className='rounded-md px-2 py-1 text-xs text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50'
            >
              Done
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function LearningPage() {
  const { data: pathData, isLoading: pathLoading } = useLearningPath();
  const { data: reviewData, isLoading: reviewLoading } = useDueReviews(10);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<
    'path' | 'reviews' | 'recommendations'
  >('path');

  const path = pathData?.learningPath;
  const reviews = reviewData?.reviews ?? [];
  const stats = reviewData?.stats;
  const dueCount = stats?.dueForReview ?? 0;

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>
      <PageHeader
        title='Learning Path'
        description='Your personalized roadmap to interview mastery'
      />

      {/* Tab bar */}
      <div className='flex gap-1 rounded-lg bg-secondary/50 p-1'>
        {(
          [
            { key: 'path', label: 'My Path' },
            {
              key: 'reviews',
              label: `Reviews${dueCount > 0 ? ` (${dueCount})` : ''}`,
            },
            { key: 'recommendations', label: 'For You' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type='button'
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Path tab ── */}
      {activeTab === 'path' && (
        <div className='space-y-4'>
          {pathLoading && (
            <div className='flex justify-center py-12'>
              <Loader2 className='size-6 animate-spin text-primary' />
            </div>
          )}

          {!pathLoading && !path && <PathGenerator />}

          {!pathLoading && path && (
            <>
              {/* Path header */}
              <Card className='border-primary/20 bg-primary/5'>
                <CardContent className='pt-5 pb-5'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <p className='font-semibold text-foreground capitalize'>
                        {path.targetRole.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        Phase {path.currentPhase} of {path.totalPhases}
                        {path.estimatedWeeks &&
                          ` · ~${path.estimatedWeeks} weeks`}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold text-primary tabular-nums'>
                        {Math.round(
                          (path.currentPhase / path.totalPhases) * 100,
                        )}
                        %
                      </p>
                      <p className='text-xs text-muted-foreground'>complete</p>
                    </div>
                  </div>
                  {/* Overall progress bar */}
                  <div className='mt-3 h-1.5 rounded-full bg-border overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-primary transition-all duration-700'
                      style={{
                        width: `${(path.currentPhase / path.totalPhases) * 100}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Phases */}
              {path.phases.map((phase) => {
                const expanded = expandedPhases.has(phase.id);
                const completedTopics = phase.topics.filter(
                  (t) => t.isCompleted,
                ).length;
                const totalTopics = phase.topics.length;

                return (
                  <Card
                    key={phase.id}
                    className={cn(phase.isCompleted && 'opacity-70')}
                  >
                    <button
                      type='button'
                      onClick={() => togglePhase(phase.id)}
                      className='w-full text-left'
                    >
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between gap-3'>
                          <div className='flex items-center gap-3'>
                            <div
                              className={cn(
                                'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                                phase.isCompleted
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-primary/10 text-primary',
                              )}
                            >
                              {phase.isCompleted ? (
                                <CheckCircle2 className='size-4' />
                              ) : (
                                phase.phaseNumber
                              )}
                            </div>
                            <div>
                              <p className='font-semibold text-sm text-foreground'>
                                {phase.title}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                {completedTopics}/{totalTopics} topics ·{' '}
                                {phase.estimatedDays}d est.
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            {phase.isCompleted && (
                              <Badge
                                variant='outline'
                                className='text-xs text-green-400 border-green-500/30'
                              >
                                Done
                              </Badge>
                            )}
                            {expanded ? (
                              <ChevronUp className='size-4 text-muted-foreground' />
                            ) : (
                              <ChevronDown className='size-4 text-muted-foreground' />
                            )}
                          </div>
                        </div>
                        {/* Phase progress */}
                        <div className='h-1 rounded-full bg-border overflow-hidden mt-2'>
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              phase.isCompleted ? 'bg-green-400' : 'bg-primary',
                            )}
                            style={{
                              width: totalTopics
                                ? `${(completedTopics / totalTopics) * 100}%`
                                : '0%',
                            }}
                          />
                        </div>
                      </CardHeader>
                    </button>

                    {expanded && (
                      <CardContent className='pt-0 space-y-2'>
                        {phase.topics.map((topic) => (
                          <TopicRow
                            key={topic.id}
                            topic={topic}
                            phaseCompleted={phase.isCompleted}
                          />
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {/* Regenerate */}
              <div className='flex justify-center pt-2'>
                <button
                  type='button'
                  onClick={() => {
                    /* show generator — in a real app would toggle a modal */
                  }}
                  className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
                >
                  <RotateCcw className='size-3' /> Regenerate path
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Reviews tab ── */}
      {activeTab === 'reviews' && (
        <div className='space-y-4'>
          {/* Stats strip */}
          {stats && (
            <div className='grid grid-cols-3 gap-3'>
              {[
                { label: 'Total cards', value: stats.totalCards },
                { label: 'Due today', value: stats.dueForReview },
                { label: 'Mastered', value: stats.mastered },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className='rounded-xl border border-border bg-card px-4 py-3 text-center'
                >
                  <p className='text-2xl font-bold text-foreground tabular-nums'>
                    {value}
                  </p>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {reviewLoading && (
            <div className='flex justify-center py-8'>
              <Loader2 className='size-6 animate-spin text-primary' />
            </div>
          )}

          {!reviewLoading && reviews.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title='No reviews due'
              description='Great job! Check back later or complete more interviews to add cards.'
            />
          )}

          {reviews.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* ── Recommendations tab ── */}
      {activeTab === 'recommendations' && <RecommendationsPanel />}
    </div>
  );
}
