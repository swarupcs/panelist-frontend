// src/components/admin/AdminAIQuestionsTab.tsx  (NEW FILE)
import { useState } from 'react'
import {
  CheckCircle, Clock, Eye, ChevronDown, ChevronUp,
  Sparkles, BarChart3, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen, ErrorState } from '@/components/common'
import {
  useAdminAIPendingQuestions, useAdminAIStats,
  useAdminAIQuestion, useApproveAIQuestion,
} from '@/hooks/useAdmin'
import { formatRelative, formatNumber } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import type { AdminAIQuestion } from '@/types/admin'

// ── Sub-tabs ───────────────────────────────────────────────────────────────
type AITab = 'pending' | 'stats'

export function AdminAIQuestionsTab() {
  const [tab,        setTab       ] = useState<AITab>('pending')
  const [pendingLimit, setPendingLimit] = useState(10)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: 'pending' as AITab, label: 'Pending Review', icon: Clock      },
          { id: 'stats'   as AITab, label: 'Statistics',     icon: BarChart3  },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}>
              <Icon className="size-3.5 shrink-0" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'pending' && <PendingQuestionsTab limit={pendingLimit} onLimitChange={setPendingLimit} />}
      {tab === 'stats'   && <AIStatsTab />}
    </div>
  )
}

// ── Pending Review ─────────────────────────────────────────────────────────

function PendingQuestionsTab({ limit, onLimitChange }: { limit: number; onLimitChange: (n: number) => void }) {
  const { data, isLoading, isError, refetch } = useAdminAIPendingQuestions(limit)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const approve = useApproveAIQuestion()

  if (isLoading) return <LoadingScreen />
  if (isError)   return <ErrorState message="Failed to load pending questions" onRetry={refetch} />

  const questions = data?.questions ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? 's' : ''} pending review
        </p>
        <div className="flex gap-2">
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-7 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none">
            {[5,10,20,50].map((n) => <option key={n} value={n}>Show {n}</option>)}
          </select>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="size-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No questions pending review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              expanded={selectedId === q.id}
              onToggle={() => setSelectedId(selectedId === q.id ? null : q.id)}
              onApprove={() => approve.mutate(q.id)}
              approving={approve.isPending && approve.variables === q.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Question Card ──────────────────────────────────────────────────────────

function QuestionCard({
  question, expanded, onToggle, onApprove, approving,
}: {
  question: AdminAIQuestion
  expanded: boolean
  onToggle: () => void
  onApprove: () => void
  approving: boolean
}) {
  const diffColors: Record<string, string> = {
    EASY:   'bg-green-400/10 text-green-400 border-green-400/20',
    MEDIUM: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    HARD:   'bg-red-400/10 text-red-400 border-red-400/20',
  }

  return (
    <Card className={cn(expanded && 'border-primary/30')}>
      <CardContent className="pt-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-xs border ${diffColors[question.difficulty] ?? ''}`}>
                {question.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {question.category.replace(/_/g, ' ').toLowerCase()}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.generationType.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatRelative(question.createdAt)}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2">{question.question}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={onToggle} className="h-7 text-xs gap-1">
            <Eye className="size-3" />
            {expanded ? 'Collapse' : 'Preview'}
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
            disabled={approving}
            className="h-7 text-xs gap-1 ml-auto"
          >
            <CheckCircle className="size-3" />
            {approving ? 'Approving…' : 'Approve'}
          </Button>
        </div>

        {/* Expanded preview */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">

            {/* Hints */}
            {question.hints.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Hints</p>
                <ol className="space-y-1">
                  {question.hints.map((hint, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                      {hint}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Solution */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Solution Approach</p>
              <p className="text-xs text-foreground">{question.solution}</p>
            </div>

            {/* Sample Code */}
            {question.sampleCode && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Sample Code</p>
                <pre className="rounded-lg bg-black/40 p-3 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {question.sampleCode}
                </pre>
              </div>
            )}

            {/* Complexity */}
            {(question.timeComplexity || question.spaceComplexity) && (
              <div className="flex gap-4">
                {question.timeComplexity && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Time</p>
                    <p className="text-xs font-mono text-foreground">{question.timeComplexity}</p>
                  </div>
                )}
                {question.spaceComplexity && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Space</p>
                    <p className="text-xs font-mono text-foreground">{question.spaceComplexity}</p>
                  </div>
                )}
              </div>
            )}

            {/* Test Cases */}
            {question.testCases.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Test Cases ({question.testCases.length})
                </p>
                <div className="space-y-2">
                  {question.testCases.slice(0, 3).map((tc, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-2 text-xs">
                      <div className="flex gap-4 flex-wrap">
                        <div>
                          <span className="text-muted-foreground">Input: </span>
                          <span className="font-mono text-foreground">{JSON.stringify(tc.input)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expected: </span>
                          <span className="font-mono text-green-400">{JSON.stringify(tc.expectedOutput)}</span>
                        </div>
                      </div>
                      {tc.explanation && (
                        <p className="text-muted-foreground mt-1">{tc.explanation}</p>
                      )}
                    </div>
                  ))}
                  {question.testCases.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{question.testCases.length - 3} more test cases</p>
                  )}
                </div>
              </div>
            )}

            {/* Base question reference */}
            {question.baseQuestion && (
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-xs text-muted-foreground">
                  Generated from: <span className="text-foreground">{question.baseQuestion.question.slice(0, 80)}…</span>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── AI Stats ───────────────────────────────────────────────────────────────

function AIStatsTab() {
  const { data, isLoading, isError, refetch } = useAdminAIStats()

  if (isLoading) return <LoadingScreen />
  if (isError)   return <ErrorState message="Failed to load AI question stats" onRetry={refetch} />
  if (!data)     return null

  // Derived status counts
  const statusMap = Object.fromEntries(
    data.byStatus.map((s) => [s.status, s._count.id])
  )
  const typeMap = Object.fromEntries(
    data.byType.map((t) => [t.generationType, t._count.id])
  )
  const totalByStatus = Object.values(statusMap).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Generated', value: data.total,                       color: 'text-foreground'  },
          { label: 'Pending Review',  value: statusMap['PENDING_REVIEW'] ?? 0,  color: 'text-yellow-400' },
          { label: 'Approved',        value: statusMap['APPROVED']       ?? 0,  color: 'text-green-400'  },
          { label: 'Rejected',        value: statusMap['REJECTED']       ?? 0,  color: 'text-destructive' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
            <p className={cn('text-2xl font-bold tabular-nums', item.color)}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By generation type */}
        <Card>
          <CardHeader><CardTitle className="text-sm">By Generation Type</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(typeMap).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(typeMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = data.total > 0 ? (count / data.total) * 100 : 0
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground capitalize">
                            {type.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span className="font-medium tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By status */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Approval Status</CardTitle></CardHeader>
          <CardContent>
            {totalByStatus === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(statusMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const pct = totalByStatus > 0 ? (count / totalByStatus) * 100 : 0
                    const colors: Record<string, string> = {
                      APPROVED:       'bg-green-400',
                      PENDING_REVIEW: 'bg-yellow-400',
                      REJECTED:       'bg-destructive',
                    }
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground capitalize">
                            {status.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span className="font-medium tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', colors[status] ?? 'bg-primary')}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent generations */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Generations</CardTitle></CardHeader>
        <CardContent>
          {data.recentGenerations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No generations yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentGenerations.map((q) => {
                const statusColors: Record<string, string> = {
                  APPROVED:       'text-green-400 bg-green-400/10 border-green-400/20',
                  PENDING_REVIEW: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                  REJECTED:       'text-destructive bg-destructive/10 border-destructive/20',
                }
                return (
                  <div key={q.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <Sparkles className="size-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{q.question}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {q.category.replace(/_/g, ' ').toLowerCase()} · {q.difficulty}
                      </p>
                    </div>
                    <Badge className={`text-xs shrink-0 border ${statusColors[q.status] ?? ''}`}>
                      {q.status === 'PENDING_REVIEW' ? 'Pending' : q.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelative(q.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
