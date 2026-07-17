// src/components/admin/AdminAnalyticsTab.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingScreen, ErrorState } from '@/components/common'
import { useAdminUserBehavior, useAdminCohorts } from '@/hooks/useAdmin'
import { formatPercent } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import type { AdminCohortData } from '@/types/admin'

export function AdminAnalyticsTab() {
  const [cohortMonths, setCohortMonths] = useState(6)

  const {
    data: behavior, isLoading: bhLoading,
    isError: bhError, refetch: bhRefetch,
  } = useAdminUserBehavior()

  const { data: cohortData, isLoading: chLoading } = useAdminCohorts(cohortMonths)

  if (bhLoading) return <LoadingScreen />
  if (bhError)   return <ErrorState message="Failed to load analytics" onRetry={bhRefetch} />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Feature Adoption */}
      {behavior && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Feature Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(behavior.featureAdoption).map(([feature, pct]) => (
                <div key={feature} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatPercent(Number(pct))}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(Number(pct), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time-of-Day Heatmap */}
      {behavior && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Activity by Hour (UTC, Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-0.5 items-end h-12">
                {behavior.timeOfDay.heatmap.map(({ hour, count }) => {
                  const maxCount = Math.max(
                    ...behavior.timeOfDay.heatmap.map((h) => h.count),
                    1,
                  )
                  const pct      = count / maxCount
                  const isPeak   = behavior.timeOfDay.peakHours.includes(hour)
                  return (
                    <div
                      key={hour}
                      className={cn(
                        'flex-1 rounded-sm transition-colors',
                        isPeak ? 'bg-primary' : 'bg-primary/30',
                      )}
                      style={{ height: `${Math.max(pct * 100, 8)}%` }}
                      title={`${hour}:00 — ${count} sessions`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Peak hours:{' '}
                {behavior.timeOfDay.peakHours.map((h) => `${h}:00`).join(', ')}
                {' · '}
                Peak days:{' '}
                {behavior.timeOfDay.peakDays
                  .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                  .join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Cohort Retention</CardTitle>
            <select
              value={cohortMonths}
              onChange={(e) => setCohortMonths(Number(e.target.value))}
              className="h-7 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[3, 6, 9, 12].map((m) => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {chLoading ? (
            <LoadingScreen />
          ) : cohortData?.cohorts?.length ? (
            <div className="overflow-x-auto">
              <CohortTable cohorts={cohortData.cohorts} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No cohort data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Cohort Table ───────────────────────────────────────────────────────────

function CohortTable({ cohorts }: { cohorts: AdminCohortData[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left py-1.5 pr-3 font-medium">Cohort</th>
          <th className="text-right py-1.5 pr-3 font-medium">Users</th>
          {['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((m) => (
            <th key={m} className="text-right py-1.5 px-1.5 font-medium">{m}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cohorts.map((cohort) => {
          const vals = [
            cohort.month0, cohort.month1, cohort.month2, cohort.month3,
            cohort.month4, cohort.month5, cohort.month6,
          ]
          return (
            <tr key={cohort.id} className="border-t border-border/50">
              <td className="py-2 pr-3 text-muted-foreground font-medium">
                {cohort.cohortMonth}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {cohort.totalUsers}
              </td>
              {vals.map((v, i) => (
                <td key={i} className="py-2 px-1.5 text-right tabular-nums">
                  {v != null ? (
                    <span
                      className={cn(
                        'inline-block px-1.5 py-0.5 rounded text-xs',
                        v >= 50
                          ? 'bg-green-400/15 text-green-400'
                          : v >= 25
                            ? 'bg-yellow-400/15 text-yellow-400'
                            : 'bg-red-400/15 text-red-400',
                      )}
                    >
                      {v}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
