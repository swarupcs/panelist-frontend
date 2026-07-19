// src/components/interview/ConditionsBlock.tsx
//
// The circumstances a score was produced under.
//
// A number on its own invites a comparison it cannot support. Two candidates
// scoring 72 did not do the same thing if one used four hints, skipped a
// question, and was on their second attempt — and a recruiter ranking them
// side by side has no way to know that from the score.
//
// Shown next to the rating rather than in a footnote, because it is not
// supplementary: it is what the number means.

import { CircleAlert, Lightbulb, RefreshCw, SkipForward } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InterviewConditions {
  hintsUsed: number;
  questionsSkipped: number;
  questionsAnswered: number;
  totalQuestions: number;
  attemptNumber: number | null;
  hintsAllowed: boolean;
  isAssessment: boolean;
}

function Note({
  icon: Icon,
  children,
  notable = false,
}: {
  icon: typeof Lightbulb;
  children: React.ReactNode;
  /** Worth a recruiter's attention, not worth alarm. */
  notable?: boolean;
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-xs',
        notable ? 'text-amber-400' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

export function ConditionsBlock({
  conditions,
  className,
}: {
  conditions: InterviewConditions;
  className?: string;
}) {
  const {
    hintsUsed,
    questionsSkipped,
    questionsAnswered,
    totalQuestions,
    attemptNumber,
    hintsAllowed,
  } = conditions;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <Note icon={CircleAlert}>
        {questionsAnswered} of {totalQuestions} answered
      </Note>

      {questionsSkipped > 0 && (
        <Note icon={SkipForward} notable>
          {questionsSkipped} skipped
        </Note>
      )}

      {/* "0 hints" means nothing if hints were switched off, so the two cases
          have to read differently. */}
      {hintsAllowed ? (
        <Note icon={Lightbulb} notable={hintsUsed > 0}>
          {hintsUsed === 0 ? 'no hints used' : `${hintsUsed} hint${hintsUsed === 1 ? '' : 's'} used`}
        </Note>
      ) : (
        <Note icon={Lightbulb}>hints were off</Note>
      )}

      {/* Only worth saying when it is not the first. A second sitting may be a
          crashed browser or a granted retake — the recruiter knows which. */}
      {attemptNumber !== null && attemptNumber > 1 && (
        <Note icon={RefreshCw} notable>
          attempt {attemptNumber}
        </Note>
      )}
    </div>
  );
}

export default ConditionsBlock;
