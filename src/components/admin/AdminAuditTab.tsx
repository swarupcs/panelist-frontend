// src/components/admin/AdminAuditTab.tsx  (FULL REPLACEMENT)
import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/common'
import { useAdminActions } from '@/hooks/useAdmin'
import { formatDateTime, formatRelative } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import type { AdminAction } from '@/types/admin'

const ACTION_COLORS: Record<string, string> = {
  USER_BANNED:          'text-destructive  bg-destructive/10  border-destructive/20',
  USER_UNBANNED:        'text-green-400    bg-green-400/10    border-green-400/20',
  USER_SUSPENDED:       'text-yellow-400   bg-yellow-400/10   border-yellow-400/20',
  USER_UNSUSPENDED:     'text-blue-400     bg-blue-400/10     border-blue-400/20',
  USER_ROLE_CHANGED:    'text-purple-400   bg-purple-400/10   border-purple-400/20',
  USER_DELETED:         'text-red-500      bg-red-500/10      border-red-500/20',
  USER_PASSWORD_RESET:  'text-orange-400   bg-orange-400/10   border-orange-400/20',
  OTHER:                'text-muted-foreground bg-muted/30    border-border',
}

export function AdminAuditTab() {
  const [actionFilter,   setActionFilter  ] = useState('')
  const [adminIdFilter,  setAdminIdFilter ] = useState('')   // previously missing
  const [targetIdFilter, setTargetIdFilter] = useState('')   // previously missing
  const [dateFrom,       setDateFrom      ] = useState('')   // previously missing
  const [dateTo,         setDateTo        ] = useState('')   // previously missing
  const [page,           setPage          ] = useState(1)
  const [showFilters,    setShowFilters   ] = useState(false)
  const [expandedDiff,   setExpandedDiff  ] = useState<string | null>(null) // changes diff

  const { data, isLoading } = useAdminActions({
    action:        actionFilter   || undefined,
    adminId:       adminIdFilter  || undefined,
    targetUserId:  targetIdFilter || undefined,
    dateFrom:      dateFrom       || undefined,
    dateTo:        dateTo         || undefined,
    page,
    limit: 30,
  })

  const clearFilters = () => {
    setActionFilter(''); setAdminIdFilter(''); setTargetIdFilter('')
    setDateFrom(''); setDateTo(''); setPage(1)
  }

  const hasActiveFilters = actionFilter || adminIdFilter || targetIdFilter || dateFrom || dateTo

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Admin Audit Log</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'} size="sm"
                onClick={() => setShowFilters((p) => !p)}
                className="h-7 text-xs"
              >
                <Filter className="size-3" /> Filters
                {hasActiveFilters && <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-xs">●</span>}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Advanced filter panel (previously missing) */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Action Type</label>
                <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none">
                  <option value="">All Actions</option>
                  {['USER_BANNED','USER_UNBANNED','USER_SUSPENDED','USER_UNSUSPENDED',
                    'USER_ROLE_CHANGED','USER_DELETED','USER_PASSWORD_RESET'].map((a) => (
                    <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Admin ID filter (previously missing) */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Admin ID (partial)</label>
                <input value={adminIdFilter}
                  onChange={(e) => { setAdminIdFilter(e.target.value); setPage(1) }}
                  placeholder="Filter by admin ID…"
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              {/* Target user ID filter (previously missing) */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Target User ID (partial)</label>
                <input value={targetIdFilter}
                  onChange={(e) => { setTargetIdFilter(e.target.value); setPage(1) }}
                  placeholder="Filter by target user…"
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              {/* Date range (previously missing) */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From Date</label>
                <input type="date" value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-xs text-foreground focus-visible:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To Date</label>
                <input type="date" value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-xs text-foreground focus-visible:outline-none" />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? <LoadingScreen /> : (
            <div className="space-y-2">
              {data?.actions.map((action) => (
                <AuditEntry
                  key={action.id}
                  action={action}
                  expanded={expandedDiff === action.id}
                  onToggle={() => setExpandedDiff(expandedDiff === action.id ? null : action.id)}
                />
              ))}
              {!data?.actions.length && (
                <p className="text-center text-sm text-muted-foreground py-8">No audit entries found</p>
              )}
            </div>
          )}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {data.pagination.total} entries · Page {page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Audit Entry with changes diff ─────────────────────────────────────────

function AuditEntry({
  action, expanded, onToggle,
}: {
  action: AdminAction; expanded: boolean; onToggle: () => void
}) {
  const hasChanges = action.changes && Object.keys(action.changes).length > 0

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <Badge className={`text-xs shrink-0 border ${ACTION_COLORS[action.action] ?? ACTION_COLORS.OTHER}`}>
        {action.action.replace(/_/g, ' ')}
      </Badge>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{action.admin.name}</span>
          <span className="text-muted-foreground text-xs ml-1">({action.admin.email})</span>
          {action.targetUser && (
            <>
              {' → '}
              <span className="text-muted-foreground">{action.targetUser.name}</span>
              <span className="text-muted-foreground text-xs ml-1">({action.targetUser.email})</span>
            </>
          )}
        </p>
        {action.reason && (
          <p className="text-xs text-muted-foreground">Reason: "{action.reason}"</p>
        )}
        <p className="text-xs text-muted-foreground/70">{formatDateTime(action.createdAt)}</p>

        {/* Changes diff (previously missing) */}
        {hasChanges && (
          <div>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={onToggle}
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? 'Hide' : 'Show'} changes
            </button>
            {expanded && (
              <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2 space-y-1.5">
                {Object.entries(action.changes as Record<string, { before?: unknown; after?: unknown }>).map(([field, diff]) => (
                  <div key={field} className="text-xs">
                    <span className="font-medium text-muted-foreground">{field}: </span>
                    {diff?.before !== undefined && (
                      <span className="text-red-400 line-through mr-2">{JSON.stringify(diff.before)}</span>
                    )}
                    {diff?.after !== undefined && (
                      <span className="text-green-400">{JSON.stringify(diff.after)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
