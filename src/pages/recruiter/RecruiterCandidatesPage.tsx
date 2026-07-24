// src/pages/recruiter/RecruiterCandidatesPage.tsx
//
// Ranked, side-by-side comparison of a recruiter's candidates — score, report
// rating, integrity risk and decision in one table — so they can rank for a
// role instead of opening one dossier at a time.

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Trophy, ArrowLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/common'
import { Seo } from '@/components/common/Seo'
import { cn } from '@/lib/cn'
import { getScoreColor } from '@/utils/formatters'
import { useCandidateComparison } from '@/hooks/useRecruiter'
import type { CandidateComparison } from '@/api/recruiter.api'

type SortKey = 'score' | 'rating' | 'recent'

const RISK_STYLE: Record<string, string> = {
  none: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  low: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
}

const OUTCOME_STYLE: Record<string, string> = {
  ADVANCED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  UNDECIDED: 'bg-muted text-muted-foreground',
}

export default function RecruiterCandidatesPage() {
  const [templateId, setTemplateId] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('score')
  const { data, isLoading } = useCandidateComparison(templateId || undefined)

  const ranked = useMemo(() => {
    const list = [...(data?.candidates ?? [])]
    list.sort((a, b) => {
      if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1)
      if (sort === 'recent') {
        return new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
      }
      return (b.score ?? -1) - (a.score ?? -1)
    })
    return list
  }, [data, sort])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <Seo title="Compare Candidates" description="Rank and compare candidates for a role." />

      <Link to="/recruiter" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to hiring
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5"><Users className="size-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compare candidates</h1>
          <p className="text-sm text-muted-foreground">Ranked by performance — click a candidate to open their dossier.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none"
        >
          <option value="">All roles</option>
          {data?.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none"
        >
          <option value="score">Sort: Score</option>
          <option value="rating">Sort: Rating</option>
          <option value="recent">Sort: Most recent</option>
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Candidates ({ranked.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8"><LoadingScreen /></div>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No candidates yet — invite someone to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                    <th className="py-2 pr-2 font-medium">#</th>
                    <th className="py-2 pr-2 font-medium">Candidate</th>
                    <th className="py-2 pr-2 font-medium text-right">Score</th>
                    <th className="py-2 pr-2 font-medium text-right">Rating</th>
                    <th className="py-2 pr-2 font-medium">Integrity</th>
                    <th className="py-2 pr-2 font-medium">Decision</th>
                    <th className="py-2 pr-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((c, i) => (
                    <CandidateRow key={c.invitationId} c={c} rank={i + 1} sort={sort} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CandidateRow({ c, rank, sort }: { c: CandidateComparison; rank: number; sort: SortKey }) {
  const navigate = useNavigate()
  const rankable = sort === 'score' ? c.score != null : sort === 'rating' ? c.rating != null : true
  return (
    <tr
      className={cn('border-b border-border/40', c.sessionId && 'hover:bg-muted/30 cursor-pointer')}
      onClick={() => c.sessionId && navigate(`/recruiter/sessions/${c.sessionId}`)}
    >
      <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
        {rankable && rank <= 3 ? <Trophy className={cn('size-3.5 inline', rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-400' : 'text-amber-700')} /> : rank}
      </td>
      <td className="py-2.5 pr-2 min-w-0">
        <p className="font-medium text-foreground truncate">{c.name || c.email}</p>
        <p className="text-xs text-muted-foreground truncate">{c.templateName}</p>
      </td>
      <td className="py-2.5 pr-2 text-right">
        {c.score != null ? <span className={cn('font-bold tabular-nums', getScoreColor(c.score))}>{Math.round(c.score)}</span> : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="py-2.5 pr-2 text-right tabular-nums">{c.rating != null ? `${c.rating}/5` : '—'}</td>
      <td className="py-2.5 pr-2">
        {c.integrityRisk ? (
          <Badge className={cn('text-xs capitalize', RISK_STYLE[c.integrityRisk] ?? 'bg-muted text-muted-foreground')}>{c.integrityRisk}</Badge>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="py-2.5 pr-2">
        <Badge className={cn('text-xs capitalize', OUTCOME_STYLE[c.outcome] ?? 'bg-muted text-muted-foreground')}>
          {c.outcome.toLowerCase()}
        </Badge>
      </td>
      <td className="py-2.5 pr-2 text-right">
        {c.sessionId && <ChevronRight className="size-4 text-muted-foreground inline" />}
      </td>
    </tr>
  )
}
