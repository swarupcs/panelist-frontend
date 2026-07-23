// src/pages/recruiter/RecruiterSessionPage.tsx
//
// The hiring-team view of one interview.
//
// Read-only by design: no controls, no way to continue or alter the session.
// It is the same session data the candidate sees, framed as a hiring decision —
// the rating and its justification first, then the evidence behind it.

import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Code2,
  FileText,
  Loader2,
  PenTool,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRecruiterDossier } from '@/hooks/usePanelist';
import { RubricBreakdown } from '@/components/interview/RubricBreakdown';
import { TranscriptTimeline } from '@/components/interview/TranscriptTimeline';
import { RecordingPlayer } from '@/components/interview/RecordingPlayer';
import { OutcomeControl } from '@/components/recruiter/OutcomeControl';
import { ConditionsBlock } from '@/components/interview/ConditionsBlock';
import type { RecruiterCodeSubmission, IntegritySummary, IntegrityRiskLevel } from '@/types/panelist';

type Tab = 'overview' | 'code' | 'design' | 'recording' | 'transcript';

const TABS: Array<{ id: Tab; label: string; icon: typeof FileText }> = [
  { id: 'overview', label: 'Assessment', icon: Sparkles },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'design', label: 'System design', icon: PenTool },
  { id: 'recording', label: 'Recording', icon: Video },
  { id: 'transcript', label: 'Transcript', icon: FileText },
];

function ratingTone(rating: number) {
  if (rating >= 4) return 'text-emerald-500 ring-emerald-500/30 bg-emerald-500/10';
  if (rating === 3) return 'text-amber-500 ring-amber-500/30 bg-amber-500/10';
  return 'text-rose-500 ring-rose-500/30 bg-rose-500/10';
}

/** Plain-language reading of the 1-5 signal, so the number isn't ambiguous. */
function ratingVerdict(rating: number) {
  return (
    {
      5: 'Strong hire signal',
      4: 'Hire signal',
      3: 'Mixed — needs a second opinion',
      2: 'Leaning no',
      1: 'No hire signal',
    }[rating] ?? 'Not rated'
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function RecruiterSessionPage() {
  const { sessionId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const { data, isLoading, isError, error, refetch } = useRecruiterDossier(sessionId);

  const finalSubmission = useMemo<RecruiterCodeSubmission | undefined>(
    () => data?.codeSubmissions.filter((s) => s.final).at(-1) ?? data?.codeSubmissions.at(-1),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading interview…
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">
          {status === 404 ? 'Interview not found' : 'Could not load this interview'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {status === 404
            ? 'This session does not exist, or you do not have access to it.'
            : 'Something went wrong fetching the session.'}
        </p>
      </div>
    );
  }

  const { session, candidate, report, reportError, codeSubmissions, drawings, transcript, recording, cameraRecording, viewerIsOwner, invitation, integrity } = data;
  const rating = report?.overallRating ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* ── Header: the hiring signal, before any of the evidence ───────── */}
      <header className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Recruiter view · read only
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-tight">
                  {candidate.name || candidate.email}
                </h1>
                <p className="text-sm text-muted-foreground">{candidate.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{session.type}</span>
              {session.difficulty && <span>{session.difficulty}</span>}
              {session.language && <span>{session.language}</span>}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(session.durationSeconds)}
              </span>
              <span>{new Date(session.startTime).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div
              className={cn(
                'flex h-20 w-20 flex-col items-center justify-center rounded-2xl ring-1',
                ratingTone(rating),
              )}
            >
              <span className="text-2xl font-bold tabular-nums">{rating || '—'}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-70">of 5</span>
            </div>
            <span className="text-sm font-medium">{ratingVerdict(rating)}</span>
          </div>
        </div>

        {/* Directly under the rating, not in a footnote. Two candidates scoring
            the same did not necessarily do the same thing, and a reader
            ranking them has no way to know that from the number alone. */}
        {report?.conditions && (
          <div className="border-t border-border/60 px-6 py-3">
            <ConditionsBlock conditions={report.conditions} />
          </div>
        )}

        {/* Objective counts sit beside the AI's judgement so a reader can sanity
            check the rating against what actually happened. */}
        <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 sm:grid-cols-4">
          <Stat label="Questions" value={String(session.totalQuestions)} />
          <Stat
            label="Final tests"
            value={
              finalSubmission?.result
                ? `${finalSubmission.result.passed}/${finalSubmission.result.total}`
                : '—'
            }
            tone={
              finalSubmission?.result
                ? finalSubmission.result.allPassed
                  ? 'good'
                  : 'bad'
                : undefined
            }
          />
          <Stat label="Submissions" value={String(codeSubmissions.length)} />
          <Stat label="Designs" value={String(drawings.length)} />
        </div>
      </header>

      {reportError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            The assessment could not be generated for this session. The evidence below is
            still complete.
          </span>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <nav className="flex gap-1 border-b border-border/60">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <section className="space-y-6">
          {/* The decision sits at the top of the assessment, not buried under
              it: it is the thing the recruiter came here to make, and the
              report is input to it rather than a verdict. */}
          {invitation?.viewerIsRecruiter && (
            <Panel
              title="Your decision"
              hint="Recorded against you, and it sets how long the recording is kept"
            >
              <OutcomeControl invitationId={invitation.id} outcome={invitation.outcome} />
            </Panel>
          )}
          {/* Proctoring signals. Only meaningful for invited interviews; shown
              high up because integrity concerns change how the rest is read. */}
          {invitation && <IntegrityPanel integrity={integrity} />}

          {report ? (
            <>
              <Panel title="Summary">
                <p className="text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
              </Panel>

              <Panel title="Rubric" hint="Each score is tied to a specific moment in the transcript">
                <RubricBreakdown scores={report.rubricScores} />
              </Panel>

              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Strengths">
                  <List items={report.strengths} tone="good" />
                </Panel>
                <Panel title="Weaknesses">
                  <List items={report.weaknesses} tone="bad" />
                </Panel>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No assessment available.</p>
          )}
        </section>
      )}

      {tab === 'code' && (
        <section className="space-y-4">
          {codeSubmissions.length === 0 && (
            <p className="text-sm text-muted-foreground">No code was submitted in this session.</p>
          )}
          {codeSubmissions.map((sub) => (
            <CodeSubmissionCard key={sub.sequence} submission={sub} />
          ))}
        </section>
      )}

      {tab === 'design' && (
        <section className="space-y-4">
          {drawings.length === 0 && (
            <p className="text-sm text-muted-foreground">No system design was submitted.</p>
          )}
          {drawings.map((d) => (
            <Panel
              key={d.sequence}
              title="System design submission"
              hint={`${d.elementCount} elements`}
            >
              {d.explanation && (
                <p className="mb-3 text-sm leading-relaxed">{d.explanation}</p>
              )}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  How the interviewer read the diagram
                </p>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {d.description}
                </pre>
              </div>
            </Panel>
          ))}
        </section>
      )}

      {tab === 'recording' && (
        <section className="space-y-4">
          <RecordingPlayer
            recording={recording}
            canDelete={viewerIsOwner}
            onDeleted={() => refetch()}
          />

          {/* Separate player rather than a picture-in-picture overlay. The two
              answer different questions — the screen shows the work, the
              camera shows who did it — and either is worth watching alone. */}
          {cameraRecording && (
            <RecordingPlayer
              recording={cameraRecording}
              title="Candidate camera"
              canDelete={viewerIsOwner}
              onDeleted={() => refetch()}
            />
          )}
        </section>
      )}

      {tab === 'transcript' && (
        <section>
          <TranscriptTimeline events={transcript} />
        </section>
      )}
    </div>
  );
}

// ── Small building blocks ──────────────────────────────────────────────────

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-lg font-semibold tabular-nums',
          tone === 'good' && 'text-emerald-500',
          tone === 'bad' && 'text-rose-500',
        )}
      >
        {value}
      </p>
    </div>
  );
}

const RISK_STYLES: Record<IntegrityRiskLevel, { ring: string; badge: string; label: string }> = {
  none:   { ring: 'text-emerald-500 ring-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'No concerns' },
  low:    { ring: 'text-sky-500 ring-sky-500/30 bg-sky-500/5',             badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20',             label: 'Low' },
  medium: { ring: 'text-amber-500 ring-amber-500/30 bg-amber-500/5',       badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',       label: 'Medium' },
  high:   { ring: 'text-rose-500 ring-rose-500/30 bg-rose-500/5',          badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',          label: 'High' },
};

function fmtAway(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const INTEGRITY_LABELS: Record<string, string> = {
  FOCUS_LOST: 'Left the window',
  FOCUS_RETURNED: 'Returned to the window',
  TAB_HIDDEN: 'Switched away from the tab',
  TAB_VISIBLE: 'Returned to the tab',
  FULLSCREEN_EXIT: 'Exited fullscreen',
  PASTE: 'Pasted into the editor',
  COPY: 'Copied from the page',
};

function IntegrityPanel({ integrity }: { integrity: IntegritySummary | null }) {
  if (!integrity) {
    return (
      <Panel title="Integrity" hint="Proctoring signals from the candidate's browser">
        <p className="text-sm text-muted-foreground">
          No integrity signals were recorded for this session — it predates proctoring, or the
          candidate's browser reported none. This is not the same as a verified clean run.
        </p>
      </Panel>
    );
  }

  const style = RISK_STYLES[integrity.riskLevel];
  const c = integrity.counts;
  const departures = c.awayCount || c.focusLost + c.tabHidden;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {integrity.riskLevel === 'none'
            ? <ShieldCheck className="h-4 w-4 text-emerald-500" />
            : <ShieldAlert className={cn('h-4 w-4', style.ring.split(' ')[0])} />}
          <h2 className="text-sm font-semibold">Integrity</h2>
        </div>
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', style.badge)}>
          {style.label} risk
        </span>
      </div>

      {/* Signal counts */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <IntegrityStat label="Left interview" value={String(departures)} warn={departures > 0} />
        <IntegrityStat label="Time away" value={c.totalAwaySeconds ? fmtAway(c.totalAwaySeconds) : '—'} warn={c.totalAwaySeconds > 0} />
        <IntegrityStat label="Large pastes" value={String(c.largePastes)} warn={c.largePastes > 0} />
        <IntegrityStat label="Fullscreen exits" value={String(c.fullscreenExits)} warn={c.fullscreenExits > 0} />
      </div>

      {/* Human-readable flags */}
      {integrity.flags.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {integrity.flags.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', integrity.riskLevel === 'none' ? 'bg-emerald-500' : 'bg-amber-500')} />
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* Raw timeline */}
      {integrity.recentEvents.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            View {integrity.recentEvents.length} recent event{integrity.recentEvents.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
            {integrity.recentEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-xs">
                <span className="text-foreground">{INTEGRITY_LABELS[e.type] ?? e.type}</span>
                <span className="text-muted-foreground">
                  {e.metadata?.chars != null && `${e.metadata.chars} chars · `}
                  {e.metadata?.awayMs != null && `${fmtAway(Math.round(e.metadata.awayMs / 1000))} · `}
                  {new Date(e.occurredAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Signals to inform your review, not an automated verdict. Some are innocuous (a candidate
        may open documentation the template permits).
      </p>
    </div>
  );
}

function IntegrityStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border/50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', warn ? 'text-amber-500' : 'text-foreground')}>{value}</p>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function List({ items, tone }: { items: string[]; tone: 'good' | 'bad' }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None recorded.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed">
          <TrendingUp
            className={cn(
              'mt-0.5 h-3.5 w-3.5 shrink-0',
              tone === 'good' ? 'text-emerald-500' : 'rotate-180 text-rose-500',
            )}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function CodeSubmissionCard({ submission }: { submission: RecruiterCodeSubmission }) {
  const r = submission.result;
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{submission.language}</span>
          {!submission.final && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              trial run
            </span>
          )}
        </div>
        {r && (
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums',
              r.allPassed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500',
            )}
          >
            {r.passed}/{r.total} tests passed
          </span>
        )}
      </div>

      <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed">
        <code>{submission.code}</code>
      </pre>

      {r?.compileError && (
        <div className="border-t border-border/50 bg-rose-500/5 px-4 py-2 text-xs text-rose-500">
          Compilation failed
        </div>
      )}
    </div>
  );
}
