// src/pages/companies/CompaniesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  ChevronRight,
  Loader2,
  Star,
  Users,
  Play,
  Filter,
  X,
} from 'lucide-react';
import { companyApi } from '@/api/company.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, EmptyState } from '@/components/common';
import { cn } from '@/lib/cn';

// ── Difficulty color ───────────────────────────────────────────────────────

function diffColor(d?: string) {
  switch (d) {
    case 'EASY':
      return 'text-green-400 border-green-500/30 bg-green-500/10';
    case 'MEDIUM':
      return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    case 'HARD':
      return 'text-red-400 border-red-500/30 bg-red-500/10';
    case 'VERY_HARD':
      return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    default:
      return 'text-muted-foreground border-border bg-secondary/30';
  }
}

function diffLabel(d?: string) {
  const map: Record<string, string> = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
    VERY_HARD: 'Very Hard',
  };
  return d ? (map[d] ?? d) : 'Unknown';
}

// ── Company card ───────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: string;
  interviewDifficulty?: string;
  isPremium?: boolean;
  _count?: {
    questions: number;
    interviewTips: number;
    interviewExperiences: number;
  };
}

function CompanyCard({
  company,
  onSelect,
}: {
  company: Company;
  onSelect: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200',
        'border-border hover:border-primary/30 hover:bg-secondary/30 hover:scale-[1.01]',
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0'>
            <Building2 className='size-5 text-primary' />
          </div>
          <div>
            <p className='font-semibold text-sm text-foreground'>
              {company.name}
            </p>
            {company.industry && (
              <p className='text-xs text-muted-foreground'>
                {company.industry}
              </p>
            )}
          </div>
        </div>
        <div className='flex flex-col items-end gap-1'>
          {company.isPremium && (
            <Badge className='text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30'>
              Premium
            </Badge>
          )}
          {company.interviewDifficulty && (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                diffColor(company.interviewDifficulty),
              )}
            >
              {diffLabel(company.interviewDifficulty)}
            </span>
          )}
        </div>
      </div>

      {company.description && (
        <p className='text-xs text-muted-foreground line-clamp-2'>
          {company.description}
        </p>
      )}

      <div className='flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2'>
        <div className='flex gap-3'>
          {company._count && (
            <>
              <span>{company._count.questions} questions</span>
              <span>{company._count.interviewExperiences} experiences</span>
            </>
          )}
        </div>
        <ChevronRight className='size-3.5' />
      </div>
    </button>
  );
}

// ── Company detail panel ───────────────────────────────────────────────────

function CompanyDetail({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['company', slug],
    queryFn: () => companyApi.getBySlug(slug),
    enabled: !!slug,
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['company', slug, 'questions'],
    queryFn: () => companyApi.getQuestions(slug, { limit: 10 }),
    enabled: !!slug,
  });

  const startPractice = useMutation({
    mutationFn: () =>
      companyApi.startPractice(slug, { questionCount: 10, duration: 30 }),
    onSuccess: (data) => {
      if (data?.session?.id) {
        navigate(`/interview/${data.session.id}`);
      }
    },
  });

  const company = companyData?.company;
  const questions = questionsData?.questions ?? [];

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
      <div className='w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl'>
        {/* Header */}
        <div className='sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4'>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10'>
              <Building2 className='size-5 text-primary' />
            </div>
            <div>
              <p className='font-semibold text-foreground'>
                {company?.name ?? '…'}
              </p>
              {company?.industry && (
                <p className='text-xs text-muted-foreground'>
                  {company.industry}
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
          {companyLoading && (
            <div className='flex justify-center py-8'>
              <Loader2 className='size-6 animate-spin text-primary' />
            </div>
          )}

          {company && (
            <>
              {company.description && (
                <p className='text-sm text-muted-foreground'>
                  {company.description}
                </p>
              )}

              {/* Meta grid */}
              <div className='grid grid-cols-2 gap-3'>
                {[
                  { label: 'Industry', value: company.industry },
                  { label: 'Size', value: company.size },
                  {
                    label: 'Difficulty',
                    value: diffLabel(company.interviewDifficulty),
                  },
                  { label: 'Questions', value: company._count?.questions ?? 0 },
                ].map(({ label, value }) =>
                  value ? (
                    <div
                      key={label}
                      className='rounded-lg border border-border bg-secondary/20 px-3 py-2'
                    >
                      <p className='text-xs text-muted-foreground'>{label}</p>
                      <p className='text-sm font-medium text-foreground'>
                        {value}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>

              {/* Practice button */}
              <Button
                variant='gradient'
                className='w-full gap-2'
                onClick={() => startPractice.mutate()}
                loading={startPractice.isPending}
              >
                <Play className='size-4' />
                Start Company Practice
              </Button>

              {startPractice.isError && (
                <p className='text-xs text-destructive text-center'>
                  Failed to start practice session.
                </p>
              )}
            </>
          )}

          {/* Questions preview */}
          {questions.length > 0 && (
            <div className='space-y-2'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                Top Questions
              </p>
              {questions.slice(0, 6).map((cq: any) => (
                <div
                  key={cq.id}
                  className='rounded-lg border border-border bg-secondary/20 px-3 py-2.5 space-y-1'
                >
                  <p className='text-sm text-foreground line-clamp-2'>
                    {cq.question?.question ?? 'Question'}
                  </p>
                  <div className='flex items-center gap-2'>
                    {cq.question?.difficulty && (
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs font-medium',
                          diffColor(cq.question.difficulty),
                        )}
                      >
                        {cq.question.difficulty.toLowerCase()}
                      </span>
                    )}
                    {cq.frequency > 1 && (
                      <span className='text-xs text-muted-foreground'>
                        {cq.frequency}× asked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {questionsLoading && (
            <div className='flex justify-center py-4'>
              <Loader2 className='size-4 animate-spin text-primary' />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'All',
  'Technology',
  'E-commerce/Technology',
  'Fintech',
  'Social Media/Technology',
  'Hospitality/Technology',
];
const DIFFICULTIES = ['All', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'];

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
    staleTime: 1000 * 60 * 5,
  });

  const companies: Company[] = data?.companies ?? [];

  const filtered = companies.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase());
    const matchIndustry =
      industryFilter === 'All' || c.industry === industryFilter;
    const matchDiff =
      diffFilter === 'All' || c.interviewDifficulty === diffFilter;
    return matchSearch && matchIndustry && matchDiff;
  });

  return (
    <div className='max-w-2xl mx-auto space-y-6 animate-fade-in'>
      <PageHeader
        title='Companies'
        description='Practice company-specific interview questions'
      />

      {/* Search + filter bar */}
      <div className='space-y-3'>
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground' />
            <input
              type='text'
              placeholder='Search companies…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50'
            />
          </div>
          <button
            type='button'
            onClick={() => setShowFilters((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
              showFilters
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Filter className='size-3.5' /> Filters
          </button>
        </div>

        {showFilters && (
          <div className='grid grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-secondary/20'>
            <div className='space-y-1.5'>
              <label className='text-xs text-muted-foreground font-medium'>
                Industry
              </label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className='w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none'
              >
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs text-muted-foreground font-medium'>
                Difficulty
              </label>
              <select
                value={diffFilter}
                onChange={(e) => setDiffFilter(e.target.value)}
                className='w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none'
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d === 'All' ? 'All' : diffLabel(d)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Company grid */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='size-8 animate-spin text-primary' />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Building2}
          title='Could not load companies'
          action={
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title='No companies found'
          description='Try adjusting your search or filters.'
        />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={() => setSelectedSlug(company.slug)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedSlug && (
        <CompanyDetail
          slug={selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
