// src/components/admin/AdminAuditTab.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/common'
import { useAdminActions } from '@/hooks/useAdmin'
import { formatDateTime } from '@/utils/formatters'

const ACTION_COLORS: Record<string, string> = {
  USER_BANNED:         'text-destructive  bg-destructive/10  border-destructive/20',
  USER_UNBANNED:       'text-green-400    bg-green-400/10    border-green-400/20',
  USER_SUSPENDED:      'text-yellow-400   bg-yellow-400/10   border-yellow-400/20',
  USER_UNSUSPENDED:    'text-blue-400     bg-blue-400/10     border-blue-400/20',
  USER_ROLE_CHANGED:   'text-purple-400   bg-purple-400/10   border-purple-400/20',
  USER_DELETED:        'text-red-500      bg-red-500/10      border-red-500/20',
  USER_PASSWORD_RESET: 'text-orange-400   bg-orange-400/10   border-orange-400/20',
  OTHER:               'text-muted-foreground bg-muted/30    border-border',
}

export function AdminAuditTab() {
  const [actionFilter, setActionFilter] = useState('')
  const [page,         setPage        ] = useState(1)

  const { data, isLoading } = useAdminActions({
    action: actionFilter || undefined,
    page,
    limit: 30,
  })

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Admin Audit Log</CardTitle>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="h-7 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="">All Actions</option>
              {[
                'USER_BANNED',
                'USER_UNBANNED',
                'USER_SUSPENDED',
                'USER_UNSUSPENDED',
                'USER_ROLE_CHANGED',
                'USER_DELETED',
                'USER_PASSWORD_RESET',
              ].map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <div className="space-y-2">
              {data?.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  <Badge
                    className={`text-xs shrink-0 border ${
                      ACTION_COLORS[action.action] ?? ACTION_COLORS.OTHER
                    }`}
                  >
                    {action.action.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{action.admin.name}</span>
                      {action.targetUser && (
                        <>
                          {' → '}
                          <span className="text-muted-foreground">
                            {action.targetUser.name}
                          </span>
                        </>
                      )}
                    </p>
                    {action.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        "{action.reason}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {formatDateTime(action.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {!data?.actions.length && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No audit entries found
                </p>
              )}
            </div>
          )}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
