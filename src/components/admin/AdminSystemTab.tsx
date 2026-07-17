// src/components/admin/AdminSystemTab.tsx  (FULL REPLACEMENT)
import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [errorHours,  setErrorHours ] = useState(24)   // previously missing
  const [apiHours,    setApiHours   ] = useState(24)
  const [expandedErr, setExpandedErr] = useState<string | null>(null) // stack trace expand

  const { data: health,  isLoading: hLoading } = useAdminSystemHealth()
  const { data: perf,    isLoading: pLoading  } = useAdminPerformance(apiHours)
  const { data: apiData, isLoading: aLoading  } = useAdminApiUsage(apiHours)
  const { data: errData, isLoading: eLoading  } = useAdminErrorLogs({
    resolved: errorFilter === 'unresolved' ? false : undefined,
    level:    errorFilter === 'critical'   ? 'CRITICAL' : undefined,
    hours:    errorHours,   // now wired to UI control
    limit: 50,
  })
  const resolveError = useResolveError()

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── System Health ── */}
      {!hLoading && health && (
        <Card>
          <CardHeader><CardTitle className="text-sm">System Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <ServiceStatus label="API"      status={health.services.api.status}      sub={`${health.services.api.responseTime}ms`} />
              <ServiceStatus label="Database" status={health.services.database.status} />
              <ServiceStatus label="Redis"    status={health.services.redis.status}    />
              <div className="flex flex-col gap-1">
                <span className={cn('text-sm font-semibold',
                  health.status === 'healthy'  ? 'text-green-400'  :
                  health.status === 'degraded' ? 'text-yellow-400' : 'text-destructive',
                )}>
                  {health.status.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">Overall Status</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div><p className="text-lg font-bold tabular-nums">{health.metrics.avgResponseTime}ms</p><p className="text-xs text-muted-foreground">Avg Response</p></div>
              <div><p className="text-lg font-bold tabular-nums">{health.metrics.errorRate}%</p><p className="text-xs text-muted-foreground">Error Rate</p></div>
              <div><p className="text-lg font-bold tabular-nums">{health.metrics.requestsPerMinute}</p><p className="text-xs text-muted-foreground">Req / min</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Performance Percentiles ── */}
      {!pLoading && perf && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm">Response Time Percentiles</CardTitle>
              <select value={apiHours} onChange={(e) => setApiHours(Number(e.target.value))}
                className="h-7 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none">
                {[1,6,12,24,48].map((h) => <option key={h} value={h}>Last {h}h</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {([['P50', perf.responseTime.p50],['P95', perf.responseTime.p95],['P99', perf.responseTime.p99]] as [string,number][]).map(([l,v]) => (
                <div key={l} className="text-center rounded-lg border border-border bg-muted/30 py-3">
                  <p className="text-xl font-bold tabular-nums text-foreground">{v}ms</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l} latency</p>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
              <div><p className="text-base font-bold tabular-nums">{perf.throughput} req/min</p><p className="text-xs text-muted-foreground">Throughput</p></div>
              <div>
                <p className={cn('text-base font-bold tabular-nums', perf.errorRate > 1 ? 'text-destructive' : 'text-green-400')}>{perf.errorRate}%</p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── API Endpoints + Slowest + Top Users ── */}
      {!aLoading && apiData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Endpoints</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 font-medium">Endpoint</th>
                      <th className="text-right py-2 font-medium">Req</th>
                      <th className="text-right py-2 font-medium">Avg</th>
                      <th className="text-right py-2 font-medium">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiData.requests.slice(0, 8).map((ep, i) => (
                      <tr key={i} className="border-b border-border/40">
                        <td className="py-1.5 text-muted-foreground font-mono truncate max-w-32">{ep.method} {ep.endpoint}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatNumber(ep.count)}</td>
                        <td className="py-1.5 text-right tabular-nums">{ep.avgTime}ms</td>
                        <td className="py-1.5 text-right tabular-nums">{ep.maxTime}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-border">
                {Object.entries(apiData.byStatusCode).map(([code, count]) => (
                  <div key={code} className="flex items-center gap-1">
                    <span className={cn('inline-block size-2 rounded-full',
                      Number(code) < 300 ? 'bg-green-400' : Number(code) < 400 ? 'bg-blue-400' : Number(code) < 500 ? 'bg-yellow-400' : 'bg-destructive',
                    )} />
                    <span className="text-xs text-muted-foreground">{code}: {count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Slowest endpoints (previously missing) */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Slowest Endpoints + Top Users</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Slowest Endpoints</p>
                <div className="space-y-1.5">
                  {apiData.slowestEndpoints.slice(0, 5).map((ep, i) => {
                    const max = apiData.slowestEndpoints[0]?.avgTime ?? 1
                    const pct = (ep.avgTime / max) * 100
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-mono truncate max-w-40">{ep.endpoint}</span>
                          <span className={cn('font-medium tabular-nums', ep.avgTime > 500 ? 'text-destructive' : ep.avgTime > 200 ? 'text-yellow-400' : 'text-green-400')}>
                            {ep.avgTime}ms
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-border overflow-hidden">
                          <div className={cn('h-full rounded-full', ep.avgTime > 500 ? 'bg-destructive' : ep.avgTime > 200 ? 'bg-yellow-400' : 'bg-green-400')}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top API users (previously missing) */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Top API Users</p>
                <div className="space-y-1">
                  {apiData.topUsers.slice(0, 5).map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono truncate max-w-40">
                        {u.userId ? u.userId.slice(0, 12) + '…' : 'anonymous'}
                      </span>
                      <span className="font-medium tabular-nums">{formatNumber(u.requests)} req</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Error Logs (with stack trace expand + hours filter) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Error Logs</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {/* Hours filter (previously missing) */}
              <select value={errorHours} onChange={(e) => setErrorHours(Number(e.target.value))}
                className="h-7 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none">
                {[1,6,12,24,48,168].map((h) => <option key={h} value={h}>Last {h === 168 ? '7d' : `${h}h`}</option>)}
              </select>
              {(['all','unresolved','critical'] as const).map((f) => (
                <Button key={f} variant={errorFilter === f ? 'default' : 'outline'} size="sm"
                  onClick={() => setErrorFilter(f)} className="h-7 text-xs capitalize">
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eLoading ? <LoadingScreen /> : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {errData?.errors.map((err) => (
                <div key={err.id} className={cn(
                  'rounded-lg border p-3',
                  err.level === 'CRITICAL' ? 'border-destructive/30 bg-destructive/5' :
                  err.level === 'ERROR'    ? 'border-red-500/20 bg-red-500/5' :
                  'border-border bg-muted/20',
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={err.level === 'CRITICAL' || err.level === 'ERROR' ? 'destructive' : 'secondary'} className="text-xs">
                          {err.level}
                        </Badge>
                        {err.endpoint && (
                          <span className="text-xs font-mono text-muted-foreground">{err.method} {err.endpoint}</span>
                        )}
                        {err.statusCode && (
                          <span className="text-xs text-muted-foreground">HTTP {err.statusCode}</span>
                        )}
                        {err.resolved && <Badge variant="secondary" className="text-xs text-green-400">Resolved</Badge>}
                      </div>
                      <p className="text-sm text-foreground break-words">{err.message}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(err.timestamp)}</p>

                      {/* Stack trace expand (previously missing) */}
                      {err.stack && (
                        <div>
                          <button
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                            onClick={() => setExpandedErr(expandedErr === err.id ? null : err.id)}
                          >
                            {expandedErr === err.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                            {expandedErr === err.id ? 'Hide' : 'Show'} stack trace
                          </button>
                          {expandedErr === err.id && (
                            <pre className="mt-2 p-2 rounded bg-black/40 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                              {err.stack}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                    {!err.resolved && (
                      <Button size="sm" variant="outline" className="shrink-0 h-6 text-xs"
                        onClick={() => resolveError.mutate(err.id)} disabled={resolveError.isPending}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!errData?.errors.length && (
                <p className="text-center text-sm text-muted-foreground py-6">No errors found</p>
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

function ServiceStatus({ label, status, sub }: { label: string; status: string; sub?: string }) {
  const isUp = status === 'up' || status === 'healthy'
  return (
    <div className="flex items-center gap-2">
      {isUp ? <CheckCircle className="size-4 text-green-400 shrink-0" /> : <XCircle className="size-4 text-destructive shrink-0" />}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}
