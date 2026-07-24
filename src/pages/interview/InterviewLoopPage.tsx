// src/pages/interview/InterviewLoopPage.tsx
//
// Company-loop simulation: a full multi-round "onsite" taken as one journey.
// One component, two routes:
//   /interview/loops           → list existing loops + create a new one
//   /interview/loops/:loopId    → run the loop round by round, then the verdict
//
// Each round is an ordinary interview session tagged to the loop, so the actual
// interviewing reuses everything that already exists; this screen only drives
// which round is next and shows the combined result.

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Building2, Play, Plus, Trash2, Loader2, CheckCircle2, Circle,
  Trophy, ArrowRight, ArrowLeft, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/common'
import { Seo } from '@/components/common/Seo'
import { cn } from '@/lib/cn'
import { formatInterviewType, getScoreColor, formatRelative } from '@/utils/formatters'
import {
  useInterviewLoops, useInterviewLoop, useCreateLoop, useStartLoopRound,
} from '@/hooks/useInterviewLoop'
import type { RoundConfig, LoopRecommendation } from '@/types/interview-loop'

const TYPE_OPTIONS = [
  'dsa', 'system_design', 'behavioral', 'frontend', 'backend', 'devops', 'mobile', 'mixed',
]
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard']

const PRESETS: Record<string, RoundConfig[]> = {
  'SWE Onsite': [
    { type: 'dsa', difficulty: 'medium', label: 'Coding 1' },
    { type: 'dsa', difficulty: 'hard', label: 'Coding 2' },
    { type: 'system_design', difficulty: 'medium', label: 'System Design' },
    { type: 'behavioral', difficulty: 'medium', label: 'Behavioural' },
  ],
  'Frontend Onsite': [
    { type: 'frontend', difficulty: 'medium', label: 'Frontend 1' },
    { type: 'dsa', difficulty: 'medium', label: 'Coding' },
    { type: 'system_design', difficulty: 'medium', label: 'UI Architecture' },
    { type: 'behavioral', difficulty: 'medium', label: 'Behavioural' },
  ],
  'Backend Onsite': [
    { type: 'dsa', difficulty: 'hard', label: 'Coding' },
    { type: 'backend', difficulty: 'medium', label: 'Backend' },
    { type: 'system_design', difficulty: 'hard', label: 'System Design' },
    { type: 'behavioral', difficulty: 'medium', label: 'Behavioural' },
  ],
}

export default function InterviewLoopPage() {
  const { loopId } = useParams<{ loopId?: string }>()
  return loopId ? <LoopDetail loopId={loopId} /> : <LoopList />
}

// ── List + create ───────────────────────────────────────────────────────────

function LoopList() {
  const navigate = useNavigate()
  const { data: loops, isLoading } = useInterviewLoops()
  const create = useCreateLoop()

  const [company, setCompany] = useState('')
  const [rounds, setRounds] = useState<RoundConfig[]>(PRESETS['SWE Onsite'])

  const setRound = (i: number, patch: Partial<RoundConfig>) =>
    setRounds((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const removeRound = (i: number) => setRounds((prev) => prev.filter((_, idx) => idx !== i))
  const addRound = () =>
    setRounds((prev) => (prev.length >= 6 ? prev : [...prev, { type: 'dsa', difficulty: 'medium' }]))

  const handleCreate = () => {
    if (rounds.length === 0) {
      toast.error('Add at least one round.')
      return
    }
    create.mutate(
      { companyTarget: company.trim() || undefined, rounds },
      {
        onSuccess: (loop) => navigate(`/interview/loops/${loop.id}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not create loop'),
      },
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
      <Seo title="Company Loop" description="Simulate a full multi-round onsite interview." />

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5"><Building2 className="size-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Loop</h1>
          <p className="text-sm text-muted-foreground">
            Run a full onsite — several rounds back to back, with a combined verdict.
          </p>
        </div>
      </div>

      {/* Create */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListChecks className="size-4" /> New loop</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="company">Target company <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="company" value={company} placeholder="e.g. Google" onChange={(e) => setCompany(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Presets:</span>
            {Object.keys(PRESETS).map((name) => (
              <Button key={name} size="sm" variant="outline" onClick={() => setRounds(PRESETS[name])}>
                {name}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Rounds ({rounds.length})</Label>
            {rounds.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <select
                  value={r.type}
                  onChange={(e) => setRound(i, { type: e.target.value })}
                  className="h-9 flex-1 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{formatInterviewType(t)}</option>)}
                </select>
                <select
                  value={r.difficulty}
                  onChange={(e) => setRound(i, { difficulty: e.target.value })}
                  className="h-9 w-28 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none"
                >
                  {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeRound(i)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            {rounds.length < 6 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addRound}>
                <Plus className="size-3.5" /> Add round
              </Button>
            )}
          </div>

          <Button onClick={handleCreate} disabled={create.isPending} className="gap-2">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Create loop
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Your loops</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6"><LoadingScreen /></div>
          ) : !loops?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No loops yet.</p>
          ) : (
            <div className="space-y-2">
              {loops.map((l) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/interview/loops/${l.id}`)}
                  className="w-full text-left rounded-lg border border-border/60 p-3 hover:bg-muted/30 transition-colors flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.totalRounds} rounds · {formatRelative(l.createdAt)}
                    </p>
                  </div>
                  <LoopStatusBadge status={l.status} />
                  {l.overallScore != null && (
                    <span className={cn('text-sm font-bold tabular-nums', getScoreColor(l.overallScore))}>
                      {Math.round(l.overallScore)}
                    </span>
                  )}
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Detail / run ─────────────────────────────────────────────────────────────

function LoopDetail({ loopId }: { loopId: string }) {
  const navigate = useNavigate()
  const { data: loop, isLoading } = useInterviewLoop(loopId)
  const startRound = useStartLoopRound()

  if (isLoading) return <div className="py-16"><LoadingScreen /></div>
  if (!loop) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Loop not found. <Link to="/interview/loops" className="text-primary underline">Back to loops</Link>
      </div>
    )
  }

  const nextIndex = loop.progress.nextRoundIndex
  const handleStart = () => {
    startRound.mutate(loopId, {
      onSuccess: (r) => navigate(`/interview/${r.sessionId}`),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not start the round'),
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
      <Seo title={loop.title} description="Company loop progress and verdict." />

      <Link to="/interview/loops" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All loops
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-primary/10 p-2.5"><Building2 className="size-6 text-primary" /></div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{loop.title}</h1>
            <p className="text-sm text-muted-foreground">
              {loop.progress.completed} of {loop.progress.total} rounds complete
            </p>
          </div>
        </div>
        <LoopStatusBadge status={loop.status} />
      </div>

      {/* Verdict when finished */}
      {loop.status === 'COMPLETED' && loop.verdict && <VerdictCard verdict={loop.verdict} />}

      {/* Rounds */}
      <Card>
        <CardHeader><CardTitle className="text-base">Rounds</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loop.rounds.map((r) => {
            const isNext = r.index === nextIndex
            const done = r.status === 'COMPLETED'
            const active = r.status === 'ACTIVE' || r.status === 'PAUSED' || r.status === 'IN_PROGRESS'
            return (
              <div
                key={r.index}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  isNext ? 'border-primary/40 bg-primary/5' : 'border-border/60',
                )}
              >
                {done
                  ? <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                  : <Circle className={cn('size-5 shrink-0', isNext ? 'text-primary' : 'text-muted-foreground')} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {r.label} <span className="text-muted-foreground">· {formatInterviewType(r.type)} · {r.difficulty}</span>
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{r.status.toLowerCase().replace('_', ' ')}</p>
                </div>
                {r.score != null && (
                  <span className={cn('text-sm font-bold tabular-nums', getScoreColor(r.score))}>{Math.round(r.score)}</span>
                )}
                {done && r.sessionId && (
                  <Link to={`/interview/results/${r.sessionId}`}>
                    <Button size="sm" variant="ghost">Results</Button>
                  </Link>
                )}
                {(isNext || active) && (
                  <Button size="sm" className="gap-1.5" disabled={startRound.isPending} onClick={handleStart}>
                    {startRound.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    {active ? 'Continue' : 'Start'}
                  </Button>
                )}
              </div>
            )
          })}

          {loop.status !== 'COMPLETED' && nextIndex != null && (
            <Button className="w-full gap-2 mt-2" disabled={startRound.isPending} onClick={handleStart}>
              {startRound.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {loop.progress.completed === 0 ? 'Start the loop' : 'Continue to next round'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Bits ─────────────────────────────────────────────────────────────────────

const RECOMMENDATION_STYLE: Record<LoopRecommendation, string> = {
  'Strong Hire': 'text-emerald-500 ring-emerald-500/30 bg-emerald-500/5',
  Hire: 'text-sky-500 ring-sky-500/30 bg-sky-500/5',
  'Lean Hire': 'text-amber-500 ring-amber-500/30 bg-amber-500/5',
  'No Hire': 'text-rose-500 ring-rose-500/30 bg-rose-500/5',
}

function VerdictCard({ verdict }: { verdict: NonNullable<import('@/types/interview-loop').InterviewLoop['verdict']> }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn('flex size-20 flex-col items-center justify-center rounded-2xl ring-1', RECOMMENDATION_STYLE[verdict.recommendation])}>
            <span className="text-2xl font-bold tabular-nums">{verdict.avgScore}</span>
            <span className="text-[10px] uppercase opacity-70">of 100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              <span className="text-lg font-semibold text-foreground">{verdict.recommendation}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{verdict.summary}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {verdict.roundScores.map((r) => (
            <div key={r.index} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-center">
              <p className={cn('text-lg font-bold tabular-nums', r.score != null ? getScoreColor(r.score) : 'text-muted-foreground')}>
                {r.score != null ? Math.round(r.score) : '—'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{r.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LoopStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    ACTIVE: 'bg-primary/10 text-primary border-primary/20',
    IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
    ABANDONED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    PAUSED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  }
  return (
    <Badge className={cn('shrink-0 capitalize', map[status] ?? 'bg-muted text-muted-foreground')}>
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  )
}
