// src/components/interview/InterviewReportPanel.tsx
//
// The end-of-session report: rating, rubric, and what to do next.
//
// Generation starts on the server the moment a session completes, so this is
// usually a cached read. When a candidate arrives before that finishes the
// request generates on demand, which takes a while — hence the explicit
// generating state rather than a bare spinner. It is a single pass over the
// whole transcript, so "a moment" is honest, not a stall.

import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRegenerateReport, useReport } from '@/hooks/usePanelist';
import { RubricBreakdown } from './RubricBreakdown';

function ratingTone(rating: number) {
  if (rating >= 4) return 'text-emerald-500 ring-emerald-500/30 bg-emerald-500/10';
  if (rating === 3) return 'text-amber-500 ring-amber-500/30 bg-amber-500/10';
  return 'text-rose-500 ring-rose-500/30 bg-rose-500/10';
}

export function InterviewReportPanel({
  sessionId,
  className,
}: {
  sessionId: string;
  className?: string;
}) {
  const { data: report, isLoading, isError, error } = useReport(sessionId);
  const regenerate = useRegenerateReport(sessionId);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-8 text-center',
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Writing your report</p>
        <p className="text-xs text-muted-foreground">
          Reading back through the whole session — this takes a moment.
        </p>
      </div>
    );
  }

  if (isError || !report) {
    // The usual cause is a session with nothing recorded in it, which retrying
    // will not fix — so this explains rather than offering a retry button.
    const message =
      (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
        ?.error?.message ?? 'The report could not be generated for this session.';
    return (
      <div
        className={cn(
          'flex items-start gap-2 rounded-xl border border-border/60 bg-card p-4 text-sm',
          className,
        )}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <span className="text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Rating + summary */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ring-1',
              ratingTone(report.overallRating),
            )}
          >
            <span className="text-xl font-bold tabular-nums">{report.overallRating}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">of 5</span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Interviewer&rsquo;s assessment
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
          </div>
        </div>

        {report.stale && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
            <span className="text-xs text-muted-foreground">
              More happened in this session after the report was written.
            </span>
            <button
              type="button"
              onClick={() => regenerate.mutate()}
              disabled={regenerate.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {regenerate.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Rewrite it
            </button>
          </div>
        )}
      </div>

      {report.rubricScores.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">How you were scored</h3>
            <span className="text-xs text-muted-foreground">
              Each score cites a moment from your session
            </span>
          </div>
          <RubricBreakdown scores={report.rubricScores} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Bullets
          title="What you did well"
          items={report.strengths}
          icon={ThumbsUp}
          tone="text-emerald-500"
        />
        <Bullets
          title="Where you lost ground"
          items={report.weaknesses}
          icon={ThumbsDown}
          tone="text-rose-500"
        />
      </div>

      {report.suggestions.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-primary">Practise this next</h3>
          <ul className="space-y-2">
            {report.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Bullets({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: typeof ThumbsUp;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className={cn('h-4 w-4', tone)} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing specific recorded.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InterviewReportPanel;
