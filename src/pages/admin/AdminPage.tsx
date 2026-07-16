// src/pages/admin/AdminPage.tsx
import { useState } from 'react'
import {
  Users,
  BarChart3,
  Activity,
  Shield,
  FileText,
  Settings,
} from 'lucide-react'
import { PageHeader, LoadingScreen } from '@/components/common'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/cn'
import { useAdminStats } from '@/hooks/useAdmin'
import { AdminOverviewTab }  from '@/components/admin/AdminOverviewTab'
import { AdminUsersTab }     from '@/components/admin/AdminUsersTab'
import { AdminAnalyticsTab } from '@/components/admin/AdminAnalyticsTab'
import { AdminSystemTab }    from '@/components/admin/AdminSystemTab'
import { AdminAuditTab }     from '@/components/admin/AdminAuditTab'
import { AdminReportsTab }   from '@/components/admin/AdminReportsTab'
import type { AdminTab }     from '@/types/admin'

// ── Tab config ─────────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',  icon: BarChart3 },
  { id: 'users',     label: 'Users',     icon: Users     },
  { id: 'analytics', label: 'Analytics', icon: Activity  },
  { id: 'system',    label: 'System',    icon: Settings  },
  { id: 'audit',     label: 'Audit Log', icon: Shield    },
  { id: 'reports',   label: 'Reports',   icon: FileText  },
]

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user }      = useAuthStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const { data: stats, isLoading: statsLoading } = useAdminStats()

  if (statsLoading) return <LoadingScreen message="Loading admin panel..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin Panel"
        description={`Signed in as ${user?.name} · ${user?.email}`}
      />

      {/* Quick-stat strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Users',   value: stats.totalUsers,          color: 'text-foreground'  },
            { label: 'Active',        value: stats.activeUsers,         color: 'text-green-400'   },
            { label: 'New Today',     value: stats.newUsersToday,       color: 'text-blue-400'    },
            { label: 'This Week',     value: stats.newUsersThisWeek,    color: 'text-blue-300'    },
            { label: 'Banned',        value: stats.bannedUsers,         color: 'text-destructive' },
            { label: 'Suspended',     value: stats.suspendedUsers,      color: 'text-yellow-400'  },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card px-4 py-3 text-center"
            >
              <p className={cn('text-2xl font-bold tabular-nums', item.color)}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap',
                'border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview'  && <AdminOverviewTab  />}
        {activeTab === 'users'     && <AdminUsersTab     />}
        {activeTab === 'analytics' && <AdminAnalyticsTab />}
        {activeTab === 'system'    && <AdminSystemTab    />}
        {activeTab === 'audit'     && <AdminAuditTab     />}
        {activeTab === 'reports'   && <AdminReportsTab   />}
      </div>
    </div>
  )
}
