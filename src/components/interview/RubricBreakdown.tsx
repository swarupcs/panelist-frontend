// src/components/interview/RubricBreakdown.tsx
//
// The five rubric dimensions with their scores and justifications.
//
// Every score is shown next to the sentence that justifies it, deliberately:
// the backend drops any dimension whose justification came back empty, so a
// number here is always backed by a specific moment in the transcript. Showing
// them apart would let a reader treat the number as the finding.

import { cn } from '@/lib/cn';
import type { RubricScore } from '@/types/panelist';

/** Muted → strong as the score rises. Kept on one scale so rows compare. */
function toneFor(score: number) {
  if (score >= 4) return { bar: 'bg-emerald-500', text: 'text-emerald-500' };
  if (score === 3) return { bar: 'bg-amber-500', text: 'text-amber-500' };
  return { bar: 'bg-rose-500', text: 'text-rose-500' };
}

export function RubricBreakdown({
  scores,
  className,
}: {
  scores: RubricScore[];
  className?: string;
}) {
  if (scores.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No rubric scores were produced for this session.
      </p>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {scores.map((row) => {
        const tone = toneFor(row.score);
        return (
          <div key={row.dimension} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{row.dimension}</span>
              <span className={cn('text-sm font-semibold tabular-nums', tone.text)}>
                {row.score}
                <span className="text-muted-foreground">/5</span>
              </span>
            </div>

            {/* Five segments rather than a continuous bar — the score is an
                integer judgement, and a smooth bar implies precision the
                rubric does not have. */}
            <div className="flex gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    step <= row.score ? tone.bar : 'bg-muted',
                  )}
                />
              ))}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {row.justification}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default RubricBreakdown;
