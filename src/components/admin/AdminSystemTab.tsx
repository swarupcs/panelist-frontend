// src/components/admin/AdminSystemTab.tsx
import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/common'
import {
  useAdminSystemHealth, useAdminPerformance,
  useAdminApiUsage, useAdminErrorLogs, useResolveError,
} from '@/hooks/useAdmin'
import { formatRelative, formatNumber } from '@/utils/formatters'
import { cn } from '@/lib/cn'

export function AdminSystemTab() {
  const [errorFilter, setErrorFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved')
  const [apiHours,    setApiHours   ] = useState(24)

  const { data: health,  isLoading: hLoading } = useAdminSystemHealth()
  const { data: perf,    isLoading: pLoading  } = useAdminPerformance(apiHours)
  const { data: apiData, isLoading: aLoading  } = useAdminApiUsage(apiHours)
  const { data: errData, isLoading: eLoading  } = useAdminErrorLogs({
    resolved: errorFilter === 'unresolved' ? false : undefined,
    level:    errorFilter === 'critical'   ? 'CRITICAL' : undefined,
    hours: 24,
    limit: 50,
  })
  const resolveError = useResolveError()

  return (
    <div className="space-y-6 animate-fade-in">

      {/* System Health */}
      {!hLoading && health && (
        <Card>
          <CardHeader><CardTitle className="text-sm">System Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <ServiceStatus
                label="API"
                status={health.services.api.status}
                sub={`${health.services.api.responseTime}ms`}
              />
              <ServiceStatus label="Database" status={health.services.database.status} />
              <ServiceStatus label="Redis"    status={health.services.redis.status}    />
              <div className="flex flex-col gap-1">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    health.status === 'healthy'  ? 'text-green-400'   :
                    health.status === 'degraded' ? 'text-yellow-400'  :
                    'text-destructive',
                  )}
                >
                  {health.status.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">Overall Status</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {health.metrics.avgResponseTime}ms
                </p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {health.metrics.errorRate}%
                </p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {health.metrics.requestsPerMinute}
                </p>
                <p className="text-xs text-muted-foreground">Req / min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Percentiles */}
      {!pLoading && perf && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm">Response Time Percentiles</CardTitle>
              <select
                value={apiHours}
                onChange={(e) => setApiHours(Number(e.target.value))}
                className="h-7 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none"
              >
                {[1, 6, 12, 24, 48].map((h) => (
                  <option key={h} value={h}>Last {h}h</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  ['P50', perf.responseTime.p50],
                  ['P95', perf.responseTime.p95],
                  ['P99', perf.responseTime.p99],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="text-center rounded-lg border border-border bg-muted/30 py-3"
                >
                  <p className="text-xl font-bold tabular-nums text-foreground">{val}ms</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label} latency</p>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-base font-bold tabular-nums text-foreground">
                  {perf.throughput} req/min
                </p>
                <p className="text-xs text-muted-foreground">Throughput</p>
              </div>
              <div>
                <p
                  className={cn(
                    'text-base font-bold tabular-nums',
                    perf.errorRate > 1 ? 'text-destructive' : 'text-green-400',
                  )}
                >
                  {perf.errorRate}%
                </p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top API Endpoints */}
      {!aLoading && apiData && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Endpoints</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 font-medium">Endpoint</th>
                    <th className="text-right py-2 font-medium">Requests</th>
                    <th className="text-right py-2 font-medium">Avg (ms)</th>
                    <th className="text-right py-2 font-medium">Max (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {apiData.requests.slice(0, 10).map((ep, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-1.5 text-muted-foreground font-mono">
                        {ep.method} {ep.endpoint}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatNumber(ep.count)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{ep.avgTime}</td>
                      <td className="py-1.5 text-right tabular-nums">{ep.maxTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status code breakdown */}
            <div className="flex gap-4 flex-wrap mt-4 pt-4 border-t border-border">
              {Object.entries(apiData.byStatusCode).map(([code, count]) => (
                <div key={code} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block size-2 rounded-full',
                      Number(code) < 300 ? 'bg-green-400'   :
                      Number(code) < 400 ? 'bg-blue-400'    :
                      Number(code) < 500 ? 'bg-yellow-400'  :
                      'bg-destructive',
                    )}
                  />
                  <span className="text-xs text-muted-foreground">{code}: {count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Error Logs</CardTitle>
            <div className="flex gap-2">
              {(['all', 'unresolved', 'critical'] as const).map((f) => (
                <Button
                  key={f}
                  variant={errorFilter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setErrorFilter(f)}
                  className="h-7 text-xs capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eLoading ? (
            <LoadingScreen />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {errData?.errors.map((err) => (
                <div
                  key={err.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-1',
                    err.level === 'CRITICAL' ? 'border-destructive/30 bg-destructive/5' :
                    err.level === 'ERROR'    ? 'border-red-500/20 bg-red-500/5'         :
                    'border-border bg-muted/20',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            err.level === 'CRITICAL' || err.level === 'ERROR'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {err.level}
                        </Badge>
                        {err.endpoint && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {err.method} {err.endpoint}
                          </span>
                        )}
                        {err.resolved && (
                          <Badge variant="secondary" className="text-xs text-green-400">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1 break-words">{err.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelative(err.timestamp)}
                      </p>
                    </div>
                    {!err.resolved && (
                      <Button
                        size="sm" variant="outline"
                        className="shrink-0 h-6 text-xs"
                        onClick={() => resolveError.mutate(err.id)}
                        disabled={resolveError.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!errData?.errors.length && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No errors found
                </p>
              )}
            </div>
          )}

          {errData?.summary && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <span>Total: {errData.summary.total}</span>
              <span className="text-destructive">Critical: {errData.summary.critical}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Service Status helper ──────────────────────────────────────────────────

function ServiceStatus({
  label,
  status,
  sub,
}: {
  label: string
  status: string
  sub?: string
}) {
  const isUp = status === 'up' || status === 'healthy'
  return (
    <div className="flex items-center gap-2">
      {isUp
        ? <CheckCircle className="size-4 text-green-400 shrink-0" />
        : <XCircle     className="size-4 text-destructive shrink-0" />
      }
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}
