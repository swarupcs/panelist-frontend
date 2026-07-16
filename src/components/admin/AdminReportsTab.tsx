// src/components/admin/AdminReportsTab.tsx
import { useState } from 'react'
import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/common'
import { useAdminReports, useGenerateReport } from '@/hooks/useAdmin'
import { formatRelative } from '@/utils/formatters'
import type { ReportFormat } from '@/types/admin'

const REPORT_TYPES = [
  'USER_GROWTH',
  'INTERVIEW_PERFORMANCE',
  'ENGAGEMENT',
  'REVENUE',
] as const

const REPORT_METRICS: Record<string, string[]> = {
  USER_GROWTH:           ['totalUsers', 'newUsers', 'dau', 'wau', 'mau', 'retention'],
  INTERVIEW_PERFORMANCE: ['totalInterviews', 'avgScore', 'completionRate', 'byType'],
  ENGAGEMENT:            ['sessionDuration', 'questionsAttempted', 'hintsUsed', 'achievements'],
  REVENUE:               ['subscriptions', 'upgrades', 'cancellations'],
}

export function AdminReportsTab() {
  const [page,     setPage   ] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name:      '',
    type:      'USER_GROWTH' as string,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate:   new Date().toISOString().split('T')[0],
    metrics:   [] as string[],
    format:    'JSON' as ReportFormat,
  })

  const { data, isLoading } = useAdminReports(page)
  const generate = useGenerateReport(() => {
    setShowForm(false)
    setForm((p) => ({ ...p, name: '', metrics: [] }))
  })

  const toggleMetric = (m: string) =>
    setForm((p) => ({
      ...p,
      metrics: p.metrics.includes(m)
        ? p.metrics.filter((x) => x !== m)
        : [...p.metrics, m],
    }))

  const handleTypeChange = (type: string) =>
    setForm((p) => ({ ...p, type, metrics: [] }))

  const handleGenerate = () => {
    if (!form.name.trim() || !form.metrics.length) return
    generate.mutate(form)
  }

  const statusIcon = (s: string) => {
    if (s === 'COMPLETED') return <CheckCircle className="size-4 text-green-400" />
    if (s === 'FAILED')    return <AlertCircle  className="size-4 text-destructive" />
    return                        <Clock        className="size-4 text-yellow-400" />
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Generate form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Generate Report</CardTitle>
            <Button
              size="sm" variant="outline"
              onClick={() => setShowForm((p) => !p)}
            >
              <Plus className="size-3.5" /> New Report
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Report Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Q4 User Growth Report"
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="flex h-8 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Metrics *
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(REPORT_METRICS[form.type] ?? []).map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMetric(m)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        form.metrics.includes(m)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm((p) => ({ ...p, format: e.target.value as ReportFormat }))}
                  className="flex h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none"
                >
                  {(['JSON', 'CSV'] as ReportFormat[]).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!form.name.trim() || !form.metrics.length || generate.isPending}
                  className="w-full sm:w-auto"
                >
                  {generate.isPending ? 'Generating…' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <div className="space-y-2">
              {data?.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  {statusIcon(report.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {report.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.type.replace(/_/g, ' ')} · {report.format} ·{' '}
                      {formatRelative(report.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      report.status === 'COMPLETED' ? 'secondary' :
                      report.status === 'FAILED'    ? 'destructive' :
                      'secondary'
                    }
                    className="text-xs shrink-0"
                  >
                    {report.status}
                  </Badge>
                </div>
              ))}
              {!data?.reports.length && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No reports generated yet
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
