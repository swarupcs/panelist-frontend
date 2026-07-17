// src/pages/topics/TopicsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Loader2,
  Play,
  X,
  BarChart3,
  Target,
} from 'lucide-react';
import { topicApi } from '@/api/topic.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, EmptyState } from '@/components/common';
import { formatCategory, getDifficultyBadge } from '@/utils/formatters';
import { cn } from '@/lib/cn';

// ── Mastery level display ──────────────────────────────────────────────────

function masteryColor(level: string) {
  switch (level) {
    case 'EXPERT':
      return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    case 'PROFICIENT':
      return 'text-green-400 border-green-500/30 bg-green-500/10';
    case 'PRACTICING':
      return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    case 'LEARNING':
      return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    default:
      return 'text-muted-foreground border-border bg-secondary/30';
  }
}

// ── Category tabs ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'ARRAYS', label: 'Arrays' },
  { value: 'TREES', label: 'Trees' },
  { value: 'GRAPHS', label: 'Graphs' },
  { value: 'DYNAMIC_PROGRAMMING', label: 'DP' },
  { value: 'REACT', label: 'React' },
  { value: 'DATABASE_DESIGN', label: 'Database' },
  { value: 'SCALABILITY', label: 'System Design' },
];

// ── Topic row ──────────────────────────────────────────────────────────────

interface Topic {
  id: string;
  name: string;
  slug: string;
  category: string;
  difficulty?: string;
  description?: string;
  totalQuestions?: number;
  subtopics?: Topic[];
  _count?: { questions: number };
}

function TopicRow({ topic, onSelect }: { topic: Topic; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtopics = (topic.subtopics?.length ?? 0) > 0;
  const qCount = topic._count?.questions ?? topic.totalQuestions ?? 0;

  return (
    <div className='rounded-xl border border-border bg-card overflow-hidden'>
      <div className='flex items-center gap-3 p-3'>
        {hasSubtopics && (
          <button
            type='button'
            onClick={() => setExpanded((o) => !o)}
            className='text-muted-foreground hover:text-foreground transition-colors shrink-0'
          >
            {expanded ? (
              <ChevronDown className='size-4' />
            ) : (
              <ChevronRight className='size-4' />
            )}
          </button>
        )}
        {!hasSubtopics && <div className='size-4 shrink-0' />}

        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-sm font-medium text-foreground'>{topic.name}</p>
            {topic.difficulty && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  getDifficultyBadge(topic.difficulty),
                )}
              >
                {topic.difficulty.toLowerCase()}
              </span>
            )}
            {qCount > 0 && (
              <span className='text-xs text-muted-foreground'>{qCount}q</span>
            )}
          </div>
          {topic.description && (
            <p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>
              {topic.description}
            </p>
          )}
        </div>

        <button
          type='button'
          onClick={onSelect}
          className='shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
        >
          Details <ChevronRight className='size-3' />
        </button>
      </div>

      {expanded && hasSubtopics && (
        <div className='border-t border-border bg-secondary/10 divide-y divide-border'>
          {topic.subtopics!.map((sub) => (
            <div
              key={sub.id}
              className='flex items-center justify-between px-6 py-2.5 gap-3'
            >
              <div>
                <p className='text-xs font-medium text-foreground'>
                  {sub.name}
                </p>
                {sub.difficulty && (
                  <span className='text-xs text-muted-foreground capitalize'>
                    {sub.difficulty.toLowerCase()}
                  </span>
                )}
              </div>
              <button
                type='button'
                onClick={() => onSelect()}
                className='text-xs text-primary hover:underline underline-offset-2'
              >
                Practice
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topic detail panel ─────────────────────────────────────────────────────

function TopicDetail({ slug, onClose }: { slug: string; onClose: () => void }) {
  const navigate = useNavigate();

  const { data: topicData, isLoading } = useQuery({
    queryKey: ['topic', slug],
    queryFn: () => topicApi.getBySlug(slug),
    enabled: !!slug,
  });

  const { data: statsData } = useQuery({
    queryKey: ['topic', slug, 'stats'],
    queryFn: () => topicApi.getStatistics(slug),
    enabled: !!slug,
  });

  const { data: progressData } = useQuery({
    queryKey: ['topic', slug, 'progress'],
    queryFn: () => topicApi.getUserProgress(slug),
    enabled: !!slug,
  });

  const startPractice = useMutation({
    mutationFn: () =>
      topicApi.startPractice(slug, { questionCount: 10, duration: 30 }),
    onSuccess: (data) => {
      if (data?.session?.id) navigate(`/interview/${data.session.id}`);
    },
  });

  const topic = topicData?.topic;
  const stats = statsData;
  const progress = progressData?.progress;

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
      <div className='w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl'>
        {/* Header */}
        <div className='sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4'>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10'>
              <BookOpen className='size-5 text-primary' />
            </div>
            <div>
              <p className='font-semibold text-foreground'>
                {topic?.name ?? '…'}
              </p>
              {topic?.category && (
                <p className='text-xs text-muted-foreground'>
                  {formatCategory(topic.category)}
                </p>
              )}
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            <X className='size-4' />
          </button>
        </div>

        <div className='p-5 space-y-5'>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='size-6 animate-spin text-primary' />
            </div>
          ) : (
            topic && (
              <>
                {topic.description && (
                  <p className='text-sm text-muted-foreground'>
                    {topic.description}
                  </p>
                )}

                {/* Stats */}
                {stats && (
                  <div className='grid grid-cols-2 gap-3'>
                    {[
                      { label: 'Total questions', value: stats.totalQuestions },
                      {
                        label: 'Avg score',
                        value:
                          stats.averageScore != null
                            ? `${Math.round(Number(stats.averageScore))}/100`
                            : '—',
                      },
                      {
                        label: 'Completion rate',
                        value:
                          stats.completionRate != null
                            ? `${Math.round(Number(stats.completionRate))}%`
                            : '—',
                      },
                      { label: 'Total users', value: stats.totalUsers },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className='rounded-lg border border-border bg-secondary/20 px-3 py-2'
                      >
                        <p className='text-xs text-muted-foreground'>{label}</p>
                        <p className='text-sm font-semibold text-foreground'>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* User progress */}
                {progress && (
                  <div className='rounded-xl border border-border bg-secondary/20 p-3 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        Your Progress
                      </p>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          masteryColor(progress.masteryLevel),
                        )}
                      >
                        {progress.masteryLevel}
                      </span>
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                      <span>{progress.questionsCompleted} completed</span>
                      <span>
                        Avg:{' '}
                        {progress.averageScore != null
                          ? `${Math.round(Number(progress.averageScore))}%`
                          : '—'}
                      </span>
                    </div>
                    {/* Mastery bar */}
                    <div className='h-1.5 rounded-full bg-border overflow-hidden'>
                      <div
                        className='h-full rounded-full bg-primary transition-all'
                        style={{
                          width: `${
                            {
                              BEGINNER: 0,
                              LEARNING: 25,
                              PRACTICING: 50,
                              PROFICIENT: 75,
                              EXPERT: 100,
                            }[progress.masteryLevel as string] ?? 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <Button
                  variant='gradient'
                  className='w-full gap-2'
                  onClick={() => startPractice.mutate()}
                  loading={startPractice.isPending}
                >
                  <Play className='size-4' />
                  Practice This Topic
                </Button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mastery overview strip ─────────────────────────────────────────────────

function MasteryOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['topics', 'mastery'],
    queryFn: topicApi.getMasteryOverview,
  });

  if (isLoading || !data) return null;

  const { statistics, total } = data;
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Target className='size-4 text-primary' />
          Mastery Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-1 h-4 rounded-full overflow-hidden'>
          {[
            { key: 'expert', color: 'bg-purple-400', count: statistics.expert },
            {
              key: 'proficient',
              color: 'bg-green-400',
              count: statistics.proficient,
            },
            {
              key: 'practicing',
              color: 'bg-blue-400',
              count: statistics.practicing,
            },
            {
              key: 'learning',
              color: 'bg-yellow-400',
              count: statistics.learning,
            },
            { key: 'beginner', color: 'bg-border', count: statistics.beginner },
          ]
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.key}
                className={cn('h-full rounded-full transition-all', s.color)}
                style={{ width: `${(s.count / total) * 100}%` }}
                title={`${s.key}: ${s.count}`}
              />
            ))}
        </div>
        <div className='flex flex-wrap gap-3 mt-3'>
          {[
            {
              label: 'Expert',
              value: statistics.expert,
              color: 'text-purple-400',
            },
            {
              label: 'Proficient',
              value: statistics.proficient,
              color: 'text-green-400',
            },
            {
              label: 'Practicing',
              value: statistics.practicing,
              color: 'text-blue-400',
            },
            {
              label: 'Learning',
              value: statistics.learning,
              color: 'text-yellow-400',
            },
          ]
            .filter((s) => s.value > 0)
            .map((s) => (
              <span key={s.label} className={cn('text-xs', s.color)}>
                {s.value} {s.label}
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TopicsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['topics', category],
    queryFn: () => topicApi.getAll(category ? { category } : undefined),
    staleTime: 1000 * 60 * 5,
  });

  const topics: Topic[] = data?.topics ?? [];

  const filtered = topics.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>
      <PageHeader
        title='Topics'
        description='Drill down into specific subjects to build mastery'
      />

      <MasteryOverview />

      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground' />
        <input
          type='text'
          placeholder='Search topics…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50'
        />
      </div>

      {/* Category filter chips */}
      <div className='flex flex-wrap gap-1.5'>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type='button'
            onClick={() => setCategory(cat.value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              category === cat.value
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Topic list */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='size-8 animate-spin text-primary' />
        </div>
      ) : isError ? (
        <EmptyState
          icon={BookOpen}
          title='Could not load topics'
          action={
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title='No topics found'
          description='Try a different search or category.'
        />
      ) : (
        <div className='space-y-2'>
          {filtered.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              onSelect={() => setSelectedSlug(topic.slug)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedSlug && (
        <TopicDetail
          slug={selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
