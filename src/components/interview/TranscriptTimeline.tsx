// src/components/interview/TranscriptTimeline.tsx
//
// Renders the structured session event log as an interview transcript.
//
// The log is the source of truth for what happened — questions, answers, code,
// real test results, drawings — so this is the same data the report was
// generated from. Timestamps are shown as an offset from the session start
// rather than wall-clock time, because what matters to a reader is how long the
// candidate took, not when they sat down.

import { useMemo } from 'react';
import {
  Bot,
  Code2,
  FlaskConical,
  Flag,
  Lightbulb,
  MessageSquare,
  PenTool,
  User,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SessionEvent, SessionEventType } from '@/types/panelist';

/** Events that carry no reader-facing content. */
const HIDDEN: ReadonlySet<SessionEventType> = new Set(['REPORT']);

const META: Record<
  SessionEventType,
  { label: string; icon: typeof Bot; accent: string; side: 'left' | 'right' }
> = {
  SESSION_START: { label: 'Interview started', icon: Flag, accent: 'text-muted-foreground', side: 'left' },
  QUESTION: { label: 'Interviewer', icon: Bot, accent: 'text-primary', side: 'left' },
  FOLLOW_UP: { label: 'Follow-up', icon: MessageSquare, accent: 'text-primary', side: 'left' },
  HINT: { label: 'Hint given', icon: Lightbulb, accent: 'text-amber-500', side: 'left' },
  ANSWER: { label: 'Candidate', icon: User, accent: 'text-foreground', side: 'right' },
  CODE_SUBMIT: { label: 'Code submitted', icon: Code2, accent: 'text-foreground', side: 'right' },
  DRAWING_SUBMIT: { label: 'Design submitted', icon: PenTool, accent: 'text-foreground', side: 'right' },
  TEST_RESULT: { label: 'Test results', icon: FlaskConical, accent: 'text-muted-foreground', side: 'left' },
  EVALUATION: { label: 'Assessment', icon: Bot, accent: 'text-muted-foreground', side: 'left' },
  SESSION_END: { label: 'Interview ended', icon: Flag, accent: 'text-muted-foreground', side: 'left' },
  REPORT: { label: 'Report', icon: Bot, accent: 'text-muted-foreground', side: 'left' },
};

function offsetLabel(from: number, at: string): string {
  const secs = Math.max(0, Math.round((new Date(at).getTime() - from) / 1000));
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}

function EventBody({ event }: { event: SessionEvent }) {
  const p = event.payload as Record<string, never>;

  switch (event.type) {
    case 'QUESTION':
    case 'FOLLOW_UP':
      return <p className="text-sm leading-relaxed">{String(p.question ?? '')}</p>;

    case 'ANSWER':
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(p.answer ?? '')}</p>;

    case 'HINT':
      return <p className="text-sm leading-relaxed">{String(p.hint ?? '')}</p>;

    case 'EVALUATION':
      return (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {String(p.evaluation ?? '')}
        </p>
      );

    case 'CODE_SUBMIT':
      return (
        <pre className="max-h-72 overflow-auto rounded-lg border border-border/50 bg-muted/40 p-3 text-xs leading-relaxed">
          <code>{String(p.code ?? '')}</code>
        </pre>
      );

    case 'TEST_RESULT': {
      const passed = Number(p.passed ?? 0);
      const total = Number(p.total ?? 0);
      const all = Boolean(p.allPassed);
      if (p.compileError) {
        return (
          <p className="text-sm text-rose-500">
            Compilation failed — no test case ran.
          </p>
        );
      }
      return (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums',
              all ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500',
            )}
          >
            {passed}/{total} passed
          </span>
          {!all && total > 0 && (
            <span className="text-muted-foreground">
              executed against the stored test cases
            </span>
          )}
        </div>
      );
    }

    case 'DRAWING_SUBMIT':
      return (
        <div className="space-y-2">
          {p.explanation ? (
            <p className="text-sm leading-relaxed">{String(p.explanation)}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Submitted without a written explanation.
            </p>
          )}
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
            {String(p.description ?? '')}
          </pre>
        </div>
      );

    case 'SESSION_END':
      return (
        <p className="text-sm text-muted-foreground">
          {String(p.reason ?? 'completed')}
          {p.score != null && ` — final score ${String(p.score)}`}
        </p>
      );

    default:
      return null;
  }
}

export function TranscriptTimeline({
  events,
  className,
}: {
  events: SessionEvent[];
  className?: string;
}) {
  const visible = useMemo(() => events.filter((e) => !HIDDEN.has(e.type)), [events]);
  // Zero rather than Date.now() when there are no events: the component
  // returns early in that case so the value is never read, and calling a clock
  // during render makes the output depend on when React happened to render.
  const startedAt = useMemo(
    () => (visible.length ? new Date(visible[0].timestamp).getTime() : 0),
    [visible],
  );

  if (visible.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No events were recorded for this session.
      </p>
    );
  }

  return (
    <ol className={cn('relative space-y-4 border-l border-border/60 pl-6', className)}>
      {visible.map((event) => {
        const meta = META[event.type];
        const Icon = meta.icon;
        const isCandidate = meta.side === 'right';

        return (
          <li key={event.id} className="relative">
            <span
              className={cn(
                'absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background',
                meta.accent,
              )}
            >
              <Icon className="h-3 w-3" />
            </span>

            <div
              className={cn(
                'rounded-xl border p-3',
                isCandidate
                  ? 'border-border/70 bg-card'
                  : 'border-border/40 bg-muted/30',
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className={cn('text-xs font-semibold', meta.accent)}>{meta.label}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {offsetLabel(startedAt, event.timestamp)}
                </span>
              </div>
              <EventBody event={event} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default TranscriptTimeline;
