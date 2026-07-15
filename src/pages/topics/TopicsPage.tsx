// src/pages/topics/TopicsPage.tsx
import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Target,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  useTopics,
  useTopic,
  useTopicQuestions,
  useMasteryOverview,
  useStartTopicPractice,
} from '@/hooks/useTopic';
import {
  PageHeader,
  LoadingScreen,
  ErrorState,
  EmptyState,
} from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import {
  getDifficultyBadge as getDiffBadge,
  formatCategory as fmtCat,
} from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';


// ── Mastery level colours ──────────────────────────────────────────────────

function masteryColor(level: string) {
  switch (level) {
    case 'EXPERT':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'PROFICIENT':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'PRACTICING':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'LEARNING':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    default:
      return 'text-muted-foreground bg-secondary border-border';
  }
}

function masteryProgress(level: string) {
  switch (level) {
    case 'EXPERT':
      return 100;
    case 'PROFICIENT':
      return 75;
    case 'PRACTICING':
      return 50;
    case 'LEARNING':
      return 25;
    default:
      return 5;
  }
}

// ── Practice Button ────────────────────────────────────────────────────────

function PracticeButton({
  slug,
  topicName,
}: {
  slug: string;
  topicName: string;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('');
  const startPractice = useStartTopicPractice();

  const handleStart = () => {
    startPractice.mutate({
      slug,
      config: {
        questionCount: count,
        difficulty: difficulty || undefined,
        duration: count * 5,
      },
    });
  };

  if (!open) {
    return (
      <Button
        variant='gradient'
        size='sm'
        className='gap-1.5'
        onClick={() => setOpen(true)}
      >
        <Target className='size-3.5' />
        Practice
      </Button>
    );
  }

  return (
    <div className='rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3'>
      <p className='text-sm font-semibold text-foreground'>
        Start {topicName} Practice
      </p>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <label className='text-xs text-muted-foreground'>Questions</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className='h-8 w-full rounded-lg border border-border bg-input px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
          </select>
        </div>
        <div className='space-y-1'>
          <label className='text-xs text-muted-foreground'>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className='h-8 w-full rounded-lg border border-border bg-input px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
          >
            <option value=''>Any</option>
            <option value='EASY'>Easy</option>
            <option value='MEDIUM'>Medium</option>
            <option value='HARD'>Hard</option>
          </select>
        </div>
      </div>
      <div className='flex gap-2'>
        <Button
          variant='gradient'
          size='sm'
          onClick={handleStart}
          disabled={startPractice.isPending}
          className='gap-1.5'
        >
          {startPractice.isPending ? (
            <Loader2 className='size-3.5 animate-spin' />
          ) : (
            <Target className='size-3.5' />
          )}
          {startPractice.isPending ? 'Starting...' : 'Start Session'}
        </Button>
        <Button variant='ghost' size='sm' onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Topic Detail ───────────────────────────────────────────────────────────

function TopicDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data: topic, isLoading } = useTopic(slug);
  const { data: questions } = useTopicQuestions(slug);
  const [diffFilter, setDiffFilter] = useState('');

  if (isLoading) return <LoadingScreen message='Loading topic...' />;
  if (!topic) return <ErrorState message='Topic not found' onRetry={onBack} />;

  const filtered = diffFilter
    ? questions?.filter((q: any) => q.question?.difficulty === diffFilter)
    : questions;

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center gap-3'>
        <button
          onClick={onBack}
          className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <ArrowLeft className='size-4' /> Back
        </button>
      </div>

      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='text-2xl font-bold text-foreground'>{topic.name}</h1>
            {topic.difficulty && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getDiffBadge(topic.difficulty.toLowerCase())}`}
              >
                {topic.difficulty}
              </span>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            {fmtCat(topic.category || '')}
          </p>
          {topic.description && (
            <p className='text-sm text-muted-foreground max-w-xl'>
              {topic.description}
            </p>
          )}
          {topic.estimatedHours && (
            <p className='text-xs text-muted-foreground'>
              ~{topic.estimatedHours}h estimated
            </p>
          )}
        </div>
        <PracticeButton slug={slug} topicName={topic.name} />
      </div>

      {/* Subtopics */}
      {topic.subtopics && topic.subtopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Subtopics</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            {topic.subtopics.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => onBack()}
                className='rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground hover:border-primary/50 transition-colors'
              >
                {sub.name}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      {questions && questions.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <CardTitle className='text-sm'>
                Questions ({questions.length})
              </CardTitle>
              <div className='flex gap-1'>
                {['', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiffFilter(d)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${diffFilter === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  >
                    {d || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            {filtered?.slice(0, 20).map((tq: any, i: number) => (
              <div key={i} className='rounded-lg border border-border p-3'>
                <p className='text-sm text-foreground leading-relaxed'>
                  {tq.question?.question}
                </p>
                <div className='flex items-center gap-2 mt-1.5'>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getDiffBadge(tq.question?.difficulty?.toLowerCase())}`}
                  >
                    {tq.question?.difficulty}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {fmtCat(tq.question?.category || '')}
                  </span>
                  {tq.importance && (
                    <span className='ml-auto text-xs text-muted-foreground'>
                      importance: {tq.importance}/10
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Mastery Overview Panel ─────────────────────────────────────────────────

function MasteryOverview() {
  const { data, isLoading } = useMasteryOverview();

  if (isLoading) return <LoadingScreen message='Loading mastery...' />;
  if (!data) return null;

  const levels = ['EXPERT', 'PROFICIENT', 'PRACTICING', 'LEARNING', 'BEGINNER'];

  return (
    <div className='space-y-4'>
      {/* Summary */}
      <div className='grid grid-cols-3 sm:grid-cols-5 gap-2'>
        {levels.map((level) => (
          <div
            key={level}
            className={`rounded-xl border p-3 text-center ${masteryColor(level)}`}
          >
            <p className='text-lg font-bold'>
              {data.statistics?.[level.toLowerCase()] ?? 0}
            </p>
            <p className='text-xs capitalize'>{level.toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* Topic list by mastery */}
      {levels.map((level) => {
        const topics = data.byMastery?.[level] ?? [];
        if (!topics.length) return null;
        return (
          <div key={level}>
            <p
              className={`text-xs font-semibold uppercase tracking-wider mb-2 ${masteryColor(level).split(' ')[0]}`}
            >
              {level}
            </p>
            <div className='space-y-1.5'>
              {topics.map((t: any) => (
                <div
                  key={t.topic?.id}
                  className='flex items-center gap-3 rounded-lg border border-border bg-card p-3'
                >
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-foreground truncate'>
                      {t.topic?.name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t.questionsCompleted} solved · avg{' '}
                      {t.averageScore
                        ? Math.round(Number(t.averageScore))
                        : '—'}
                    </p>
                  </div>
                  <div className='w-20'>
                    <Progress
                      value={masteryProgress(level)}
                      className='h-1.5'
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type Tab = 'topics' | 'mastery';

export default function TopicsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('topics');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  const {
    data: topics,
    isLoading,
    isError,
    refetch,
  } = useTopics(
    categoryFilter || diffFilter
      ? {
          category: categoryFilter || undefined,
          difficulty: diffFilter || undefined,
        }
      : undefined,
  );

  if (selectedSlug) {
    return (
      <TopicDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />
    );
  }

  if (isLoading) return <LoadingScreen message='Loading topics...' />;
  if (isError)
    return <ErrorState message='Failed to load topics' onRetry={refetch} />;

  const categories = Array.from(
    new Set(topics?.map((t: any) => t.category).filter(Boolean) ?? []),
  );

  return (
    <div className='space-y-6 animate-fade-in'>
      <PageHeader
        title='Topic Practice'
        description='Master specific topics with targeted practice sessions'
      />

      {/* Plain state tab bar — avoids Radix grid bug */}
      <div className='flex gap-1 rounded-lg bg-secondary/50 p-1 w-full max-w-xs'>
        {(['topics', 'mastery'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type='button'
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 capitalize ${
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            {tab === 'mastery' ? 'My Mastery' : 'Topics'}
          </button>
        ))}
      </div>

      {activeTab === 'mastery' && <MasteryOverview />}

      {activeTab === 'topics' && (
        <>
          {/* Filters */}
          <div className='flex flex-wrap gap-2'>
            <div className='flex flex-wrap gap-1.5'>
              {['', ...categories].map((cat) => (
                <button
                  key={cat || 'all'}
                  onClick={() => setCategoryFilter(cat as string)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {cat ? fmtCat(cat as string) : 'All Categories'}
                </button>
              ))}
            </div>
          </div>

          {!topics?.length ? (
            <EmptyState
              icon={BookOpen}
              title='No topics yet'
              description='Topics will appear here once loaded from the server.'
            />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {topics.map((topic: any) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedSlug(topic.slug)}
                  className='text-left rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group space-y-3'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
                      <BookOpen className='size-5 text-primary' />
                    </div>
                    {topic.difficulty && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0 ${getDiffBadge(topic.difficulty.toLowerCase())}`}
                      >
                        {topic.difficulty}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className='font-semibold text-foreground group-hover:text-primary transition-colors'>
                      {topic.name}
                    </h3>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      {fmtCat(topic.category || '')}
                    </p>
                    {topic.description && (
                      <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                        {topic.description}
                      </p>
                    )}
                  </div>

                  <div className='flex items-center justify-between pt-2 border-t border-border'>
                    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                      <span>{topic._count?.questions ?? 0} questions</span>
                      {topic.estimatedHours && (
                        <span>~{topic.estimatedHours}h</span>
                      )}
                    </div>
                    <ChevronRight className='size-4 text-muted-foreground group-hover:text-primary transition-colors' />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
