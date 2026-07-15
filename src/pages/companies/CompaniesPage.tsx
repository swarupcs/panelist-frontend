// src/pages/companies/CompaniesPage.tsx
import { useState } from 'react';
import {
  Building2,
  ChevronRight,
  Target,
  Users,
  Star,
  Loader2,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import {
  useCompanies,
  useCompany,
  useCompanyQuestions,
  useCompanyProgress,
  useStartCompanyPractice,
} from '@/hooks/useCompany';
import {
  PageHeader,
  LoadingScreen,
  ErrorState,
  EmptyState,
} from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getDifficultyBadge, formatCategory } from '@/utils/formatters';
import { cn } from '@/lib/cn';

// ── Difficulty badge colors for company difficulty (EASY/MEDIUM/HARD/VERY_HARD) ──

function companyDifficultyBadge(d: string) {
  switch (d) {
    case 'EASY':
      return 'bg-green-400/10 text-green-400 border-green-400/20';
    case 'MEDIUM':
      return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
    case 'HARD':
      return 'bg-red-400/10 text-red-400 border-red-400/20';
    case 'VERY_HARD':
      return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// ── Practice Config Dialog ─────────────────────────────────────────────────

function PracticeButton({
  slug,
  companyName,
}: {
  slug: string;
  companyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('');
  const startPractice = useStartCompanyPractice();

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
        Start {companyName} Practice
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

// ── Company Detail Panel ───────────────────────────────────────────────────

function CompanyDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data: company, isLoading } = useCompany(slug);
  const { data: questions } = useCompanyQuestions(slug);
  const { data: progress } = useCompanyProgress(slug);
  const [diffFilter, setDiffFilter] = useState('');

  if (isLoading) return <LoadingScreen message='Loading company...' />;
  if (!company)
    return <ErrorState message='Company not found' onRetry={onBack} />;

  const filtered = diffFilter
    ? questions?.filter((q: any) => q.question?.difficulty === diffFilter)
    : questions;

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
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
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-foreground'>
              {company.name}
            </h1>
            {company.interviewDifficulty && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                  companyDifficultyBadge(company.interviewDifficulty),
                )}
              >
                {company.interviewDifficulty.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            {company.industry} · {company.size}
          </p>
          {company.description && (
            <p className='text-sm text-muted-foreground max-w-xl'>
              {company.description}
            </p>
          )}
        </div>
        <PracticeButton slug={slug} companyName={company.name} />
      </div>

      {/* Progress card */}
      {progress && (
        <div className='grid grid-cols-3 gap-3'>
          {[
            { label: 'Attempted', value: progress.questionsAttempted ?? 0 },
            { label: 'Completed', value: progress.questionsCompleted ?? 0 },
            {
              label: 'Avg Score',
              value: progress.averageScore
                ? `${Math.round(Number(progress.averageScore))}`
                : '—',
            },
          ].map((s) => (
            <div
              key={s.label}
              className='rounded-xl border border-border bg-card p-3 text-center'
            >
              <p className='text-xl font-bold text-foreground'>{s.value}</p>
              <p className='text-xs text-muted-foreground'>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Interview process */}
      {company.interviewProcess?.rounds && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Interview Process</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {company.interviewProcess.rounds.map((round: any, i: number) => (
              <div key={i} className='flex items-center gap-3'>
                <div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                  {i + 1}
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-foreground'>
                    {round.name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {round.duration} min · {round.focus?.join(', ')}
                  </p>
                </div>
              </div>
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
                Common Questions ({questions.length})
              </CardTitle>
              <div className='flex gap-1'>
                {['', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiffFilter(d)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      diffFilter === d
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                    )}
                  >
                    {d || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            {filtered?.slice(0, 20).map((cq: any, i: number) => (
              <div
                key={i}
                className='flex items-start gap-3 rounded-lg border border-border p-3'
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-foreground leading-relaxed'>
                    {cq.question?.question}
                  </p>
                  <div className='flex items-center gap-2 mt-1.5'>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                        getDifficultyBadge(
                          cq.question?.difficulty?.toLowerCase(),
                        ),
                      )}
                    >
                      {cq.question?.difficulty}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {formatCategory(cq.question?.category || '')}
                    </span>
                    {cq.frequency && (
                      <span className='text-xs text-muted-foreground ml-auto'>
                        freq: {cq.frequency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Company List ───────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState('');
  const {
    data: companies,
    isLoading,
    isError,
    refetch,
  } = useCompanies(industryFilter ? { industry: industryFilter } : undefined);

  if (selectedSlug) {
    return (
      <CompanyDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />
    );
  }

  if (isLoading) return <LoadingScreen message='Loading companies...' />;
  if (isError)
    return <ErrorState message='Failed to load companies' onRetry={refetch} />;

  const industries = Array.from(
    new Set(companies?.map((c: any) => c.industry).filter(Boolean) ?? []),
  );

  return (
    <div className='space-y-6 animate-fade-in'>
      <PageHeader
        title='Company Practice'
        description='Practice with real interview questions from top tech companies'
      />

      {/* Industry filter */}
      <div className='flex flex-wrap gap-2'>
        {['', ...industries].map((ind) => (
          <button
            key={ind || 'all'}
            onClick={() => setIndustryFilter(ind as string)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              industryFilter === ind
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            {ind || 'All Industries'}
          </button>
        ))}
      </div>

      {!companies?.length ? (
        <EmptyState
          icon={Building2}
          title='No companies yet'
          description='Company question banks will appear here once loaded.'
        />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {companies.map((company: any) => (
            <button
              key={company.id}
              onClick={() => setSelectedSlug(company.slug)}
              className='text-left rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group'
            >
              <div className='flex items-start justify-between gap-2 mb-3'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
                  <Building2 className='size-5 text-primary' />
                </div>
                {company.interviewDifficulty && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0',
                      companyDifficultyBadge(company.interviewDifficulty),
                    )}
                  >
                    {company.interviewDifficulty.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h3 className='font-semibold text-foreground group-hover:text-primary transition-colors'>
                {company.name}
              </h3>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {company.industry}
              </p>

              <div className='flex items-center gap-3 mt-3 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <BookOpen className='size-3' />
                  {company._count?.questions ?? 0} questions
                </span>
                {company.isPremium && (
                  <span className='flex items-center gap-1 text-yellow-400'>
                    <Star className='size-3' />
                    Premium
                  </span>
                )}
              </div>

              <div className='flex items-center justify-between mt-3 pt-3 border-t border-border'>
                <span className='text-xs text-muted-foreground'>
                  {company.totalInterviews ?? 0} interviews
                </span>
                <ChevronRight className='size-4 text-muted-foreground group-hover:text-primary transition-colors' />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
