import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Users, Shield, Ban, AlertTriangle, BarChart3, Activity, Search, MoreVertical } from 'lucide-react'
import api from '@/api/axios'
import { PageHeader, StatCard, LoadingScreen, ErrorState } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

import { Badge } from '@/components/ui/Badge'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'

import { queryClient } from '@/lib/queryClient'

import { cn } from '@/lib/cn'
import type { AdminDashboardStats, AdminUserListItem, Pagination } from '@/types'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatRelative } from '@/utils/formatters';

// ── API calls ──────────────────────────────────────────────────────────────

const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const res = await api.get('/admin/users/stats')
    return res.data.data
  },
  getUsers: async (params: { search?: string; page?: number; limit?: number }): Promise<{ users: AdminUserListItem[]; pagination: Pagination }> => {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.page) q.set('page', String(params.page))
    if (params.limit) q.set('limit', String(params.limit))
    const res = await api.get(`/admin/users?${q}`)
    return res.data.data
  },
  banUser: async (userId: string, reason: string) => {
    const res = await api.post(`/admin/users/${userId}/ban`, { reason, isPermanent: true })
    return res.data.data
  },
  unbanUser: async (userId: string) => {
    const res = await api.post(`/admin/users/${userId}/unban`)
    return res.data.data
  },
  changeRole: async (userId: string, role: string) => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role })
    return res.data.data
  },
}

// ── User row component ─────────────────────────────────────────────────────

function UserRow({ user, onBan, onUnban, onChangeRole }: {
  user: AdminUserListItem
  onBan: (id: string) => void
  onUnban: (id: string) => void
  onChangeRole: (id: string, role: string) => void
}) {
  const initials = user.name?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <Badge
            variant={user.role === 'ADMIN' ? 'accent' : user.role === 'PREMIUM' ? 'info' : 'secondary'}
            className="text-xs shrink-0"
          >
            {user.role}
          </Badge>
          {user.isBanned && <Badge variant="destructive" className="text-xs shrink-0">Banned</Badge>}
          {user.isSuspended && <Badge variant="warning" className="text-xs shrink-0">Suspended</Badge>}
          {user.isSuspicious && <Badge className="text-xs shrink-0 bg-orange-500/10 text-orange-400 border-orange-500/20">Suspicious</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="text-right hidden sm:block shrink-0">
        <p className="text-xs text-muted-foreground">{user._count.interviewSessions} sessions</p>
        {user.lastLogin && <p className="text-xs text-muted-foreground">{formatRelative(user.lastLogin)}</p>}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 shrink-0">
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user.isBanned ? (
            <DropdownMenuItem onClick={() => onUnban(user.id)} className="text-green-400">
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onBan(user.id)} className="text-destructive">
              <Ban className="size-4" /> Ban User
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {['FREE', 'PREMIUM', 'ADMIN'].filter(r => r !== user.role).map(role => (
            <DropdownMenuItem key={role} onClick={() => onChangeRole(user.id, role)}>
              Make {role}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Main Admin Page ────────────────────────────────────────────────────────

export default function AdminPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [banTarget, setBanTarget] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout((window as any).__searchTimer)
    ;(window as any).__searchTimer = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getDashboardStats,
  })

  const { data: usersData, isLoading: usersLoading, isError } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch, page],
    queryFn: () => adminApi.getUsers({ search: debouncedSearch, page, limit: 20 }),
  })

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.banUser(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setBanTarget(null); setBanReason('') },
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.changeRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  if (statsLoading) return <LoadingScreen message="Loading admin panel..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin Panel"
        description="Manage users, monitor system health, and view analytics"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Active Users" value={stats?.activeUsers ?? 0} icon={Activity} trend="up" trendValue={`${stats?.newUsersToday ?? 0} today`} />
        <StatCard title="Banned" value={stats?.bannedUsers ?? 0} icon={Ban} iconClassName="bg-destructive/10 text-destructive" />
        <StatCard title="Suspended" value={stats?.suspendedUsers ?? 0} icon={Shield} iconClassName="bg-yellow-500/10 text-yellow-400" />
      </div>

      {/* Role breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {[
                { label: 'Free', value: stats.byRole.free, color: 'text-muted-foreground' },
                { label: 'Premium', value: stats.byRole.premium, color: 'text-blue-400' },
                { label: 'Admin', value: stats.byRole.admin, color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label}>
                  <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" /> User Management
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-border bg-input pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <LoadingScreen />
          ) : isError ? (
            <ErrorState message="Failed to load users" />
          ) : (
            <>
              <div>
                {usersData?.users?.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onBan={(id) => setBanTarget(id)}
                    onUnban={(id) => unbanMutation.mutate(id)}
                    onChangeRole={(id, role) => roleMutation.mutate({ id, role })}
                  />
                ))}
                {!usersData?.users?.length && (
                  <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
                )}
              </div>

              {/* Pagination */}
              {usersData?.pagination && usersData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {usersData.pagination.total} users · Page {page} of {usersData.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= usersData.pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ban confirmation dialog */}
      <AlertDialog open={!!banTarget} onOpenChange={() => { setBanTarget(null); setBanReason('') }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke all sessions and prevent the user from logging in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Reason</label>
            <input
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Violation reason..."
              className="flex h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!banReason.trim() || banMutation.isPending}
              onClick={() => banTarget && banMutation.mutate({ id: banTarget, reason: banReason })}
            >
              {banMutation.isPending ? 'Banning...' : 'Ban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
