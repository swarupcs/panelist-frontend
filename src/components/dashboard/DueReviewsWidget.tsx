// src/components/dashboard/DueReviewsWidget.tsx
//
// Topics the spaced-repetition schedule says are due for review.
//
// The schedule has been running since the first interview — every answer feeds
// a quality score into it — but nothing ever showed the result, so reviews came
// due and passed unnoticed. This is the nudge that makes that work visible.

import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardContent } from '@/components/ui/card';
import { useDueReviews } from '@/hooks/useSrs';
import type { DueReviewItem } from '@/api/srs.api';

/** ARRAYS → Arrays, DYNAMIC_PROGRAMMING → Dynamic programming. */
function readableCategory(category: string): string {
  const words = category.toLowerCase().split('_');
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}

/**
 * A low ease factor means the topic keeps being answered poorly, so it is
 * scheduled more often. Surfacing it tells the candidate why a topic keeps
 * reappearing rather than leaving the schedule feeling arbitrary.
 */
function difficultyLabel(easeFactor: number): { label: string; tone: string } | null {
  if (easeFactor <= 1.8) return { label: 'struggling', tone: 'text-rose-500' };
  if (easeFactor <= 2.2) return { label: 'shaky', tone: 'text-amber-500' };
  return null;
}

function overdueBy(nextReview: string): string {
  const days = Math.floor((Date.now() - new Date(nextReview).getTime()) / 86_400_000);
  if (days <= 0) return 'due today';
  if (days === 1) return 'due yesterday';
  return `${days} days overdue`;
}

export function DueReviewsWidget({ className }: { className?: string }) {
  const { data, isLoading, isError } = useDueReviews(5);

  // A widget that renders an error box on a dashboard is noise. Nothing is due
  // most days, and that is a success state, not an empty one — so it hides
  // rather than occupying space with "no reviews".
  if (isLoading || isError || !data || data.length === 0) return null;

  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-transparent', className)}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Due for review</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? 'topic' : 'topics'}
          </span>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          Topics you answered poorly, resurfaced when you&rsquo;re most likely to
          have forgotten them.
        </p>

        <ul className="mb-4 space-y-1.5">
          {data.map((item: DueReviewItem) => {
            const ease = Number(item.easeFactor);
            const difficulty = difficultyLabel(ease);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2"
              >
                <span className="text-sm font-medium">{readableCategory(item.category)}</span>
                <span className="flex items-center gap-2 text-xs">
                  {difficulty && (
                    <span className={cn('font-medium', difficulty.tone)}>{difficulty.label}</span>
                  )}
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CalendarClock className="size-3" />
                    {overdueBy(item.nextReview)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        {/* Starts an interview drawn from exactly these categories — the setup
            page already offers an SRS track, this just skips the choosing. */}
        <Link
          to="/interview?type=srs_review"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Review them now
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default DueReviewsWidget;
