// src/components/recruiter/OutcomeControl.tsx
//
// Recording what a human decided about a candidate.
//
// Not bookkeeping, for two reasons worth stating in the UI itself.
//
// A person decides, not the model. Several jurisdictions restrict decisions
// made solely by automated processing, and an AI-generated score used for
// hiring is exactly that unless somebody records having made the call. This is
// where they do.
//
// It also starts the retention clock: an invited interview's recording is kept
// for a window after the decision rather than after the interview, so a hiring
// process that runs six weeks does not lose its evidence at week four.

import { Check, Loader2, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useRecordOutcome, type HiringOutcome } from '@/hooks/useRecruiter';

const LABEL: Record<HiringOutcome, string> = {
  UNDECIDED: 'Not decided',
  ADVANCED: 'Advanced',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrew',
};

const TONE: Record<HiringOutcome, string> = {
  UNDECIDED: 'text-muted-foreground',
  ADVANCED: 'text-emerald-400',
  REJECTED: 'text-rose-400',
  WITHDRAWN: 'text-muted-foreground',
};

export function OutcomeControl({
  invitationId,
  outcome,
  compact = false,
}: {
  invitationId: string;
  outcome: HiringOutcome;
  /** The pipeline shows the decision; the dossier is where it is made. */
  compact?: boolean;
}) {
  const record = useRecordOutcome();
  const decided = outcome !== 'UNDECIDED';

  if (compact) {
    return (
      <span className={cn('text-xs font-medium', TONE[outcome])}>
        {decided ? LABEL[outcome] : ''}
      </span>
    );
  }

  const set = (next: HiringOutcome) => record.mutate({ invitationId, outcome: next });

  if (decided) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('text-sm font-medium', TONE[outcome])}>{LABEL[outcome]}</span>
        {/* A decision recorded in error must be correctable. Reverting also
            clears the timestamp, so retention does not go on running from a
            decision that no longer exists. */}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-muted-foreground"
          disabled={record.isPending}
          onClick={() => set('UNDECIDED')}
        >
          {record.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={record.isPending}
          onClick={() => set('ADVANCED')}
        >
          <Check className="size-3.5 text-emerald-400" />
          Advance
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={record.isPending}
          onClick={() => set('REJECTED')}
        >
          <X className="size-3.5 text-rose-400" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          disabled={record.isPending}
          onClick={() => set('WITHDRAWN')}
        >
          Withdrew
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        The assessment is input, not a verdict — recording your decision is what
        makes it yours. It also sets how long the recording is kept.
      </p>
    </div>
  );
}

export default OutcomeControl;
