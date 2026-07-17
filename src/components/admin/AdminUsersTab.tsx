// src/components/admin/AdminUsersTab.tsx  (FULL REPLACEMENT)
import { useState, useCallback } from 'react'
import {
  Search, Ban, ShieldAlert, ShieldOff, Trash2, Key,
  StickyNote, AlertTriangle, MoreVertical, ChevronLeft,
  ChevronRight, UserCheck, Download, Eye, RefreshCw,
  History, Trophy, Brain, Wifi,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoadingScreen, ErrorState } from '@/components/common'
import {
  useAdminUsers, useBanUser, useUnbanUser, useSuspendUser,
  useUnsuspendUser, useChangeUserRole, useDeleteUser,
  useResetUserPassword, useMarkSuspicious, useBulkBanUsers,
  useAdminUserDetails, useUpdateAdminNotes,
} from '@/hooks/useAdmin'
import { adminUserApi } from '@/api/admin.api'
import { formatRelative, formatDate, formatDateTime, getInitials } from '@/utils/formatters'
import { cn } from '@/lib/cn'
import type { AdminUserListItem, UserFilterStatus, UserSortField } from '@/types/admin'

// ── Types ──────────────────────────────────────────────────────────────────

type DialogType =
  | 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'delete'
  | 'resetPassword' | 'notes' | 'bulk-ban' | null

interface DialogState {
  type: DialogType; userId: string | null; reason: string
  durationHours: number; newPassword: string; notes: string
}

const INITIAL_DIALOG: DialogState = {
  type: null, userId: null, reason: '',
  durationHours: 24, newPassword: '', notes: '',
}

// Detail sub-tabs
type DetailTab = 'overview' | 'bans' | 'suspensions' | 'sessions' | 'achievements' | 'weak-areas'

// ── Main ───────────────────────────────────────────────────────────────────

export function AdminUsersTab() {
  const [search,     setSearch    ] = useState('')
  const [debSearch,  setDebSearch ] = useState('')
  const [status,     setStatus    ] = useState<UserFilterStatus>('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [suspicious, setSuspicious] = useState(false)
  const [sortBy,     setSortBy    ] = useState<UserSortField>('createdAt')
  const [sortOrder,  setSortOrder ] = useState<'asc' | 'desc'>('desc')
  const [page,       setPage      ] = useState(1)
  const [selected,   setSelected  ] = useState<Set<string>>(new Set())
  const [detailUser, setDetailUser] = useState<string | null>(null)
  const [dialog,     setDialog    ] = useState<DialogState>(INITIAL_DIALOG)

  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    clearTimeout((window as any).__adminSearch)
    ;(window as any).__adminSearch = setTimeout(() => { setDebSearch(val); setPage(1) }, 350)
  }, [])

  const { data, isLoading, isError, refetch } = useAdminUsers({
    search: debSearch, status, role: roleFilter || undefined,
    isSuspicious: suspicious || undefined, page, limit: 20, sortBy, sortOrder,
  })

  const banUser        = useBanUser()
  const unbanUser      = useUnbanUser()
  const suspendUser    = useSuspendUser()
  const unsuspendUser  = useUnsuspendUser()
  const changeRole     = useChangeUserRole()
  const deleteUser     = useDeleteUser(() => setDetailUser(null))
  const resetPassword  = useResetUserPassword()
  const markSuspicious = useMarkSuspicious()
  const bulkBan        = useBulkBanUsers(() => setSelected(new Set()))
  const updateNotes    = useUpdateAdminNotes()

  const openDialog = (type: DialogType, userId: string, prefill?: Partial<DialogState>) =>
    setDialog({ ...INITIAL_DIALOG, type, userId, ...prefill })
  const closeDialog = () => setDialog(INITIAL_DIALOG)

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = () => {
    if (!data?.users) return
    setSelected((prev) =>
      prev.size === data.users.length ? new Set() : new Set(data.users.map((u) => u.id))
    )
  }

  const handleConfirm = () => {
    const { type, userId, reason, durationHours, newPassword, notes } = dialog
    if (!userId) return
    switch (type) {
      case 'ban':           banUser.mutate({ userId, reason });                    break
      case 'unban':         unbanUser.mutate(userId);                              break
      case 'suspend':       suspendUser.mutate({ userId, reason, durationHours }); break
      case 'unsuspend':     unsuspendUser.mutate(userId);                          break
      case 'delete':        deleteUser.mutate({ userId, reason });                 break
      case 'resetPassword': resetPassword.mutate({ userId, newPassword });         break
      case 'notes':         updateNotes.mutate({ userId, notes });                 break
      case 'bulk-ban':      bulkBan.mutate({ userIds: [...selected], reason });    break
    }
    closeDialog()
  }

  const isPending =
    banUser.isPending || unbanUser.isPending || suspendUser.isPending ||
    unsuspendUser.isPending || changeRole.isPending || deleteUser.isPending ||
    resetPassword.isPending || bulkBan.isPending

  const exportUser = async (userId: string) => {
    const exportData = await adminUserApi.exportUserData(userId)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: `user-${userId}.json` }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={search} onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or email…"
                className="flex h-8 w-full rounded-lg border border-border bg-input pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select value={status} onChange={(e) => { setStatus(e.target.value as UserFilterStatus); setPage(1) }}
              className="h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none">
              {(['all','active','banned','suspended','inactive'] as UserFilterStatus[]).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none">
              <option value="">All Roles</option>
              {['FREE','PREMIUM','ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button variant={suspicious ? 'default' : 'outline'} size="sm" className="h-8"
              onClick={() => { setSuspicious((p) => !p); setPage(1) }}>
              <AlertTriangle className="size-3.5" /> Suspicious
            </Button>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => { const [f,o] = e.target.value.split(':'); setSortBy(f as UserSortField); setSortOrder(o as 'asc'|'desc') }}
              className="h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none">
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="lastLogin:desc">Last Login</option>
              <option value="email:asc">Email A→Z</option>
              <option value="name:asc">Name A→Z</option>
            </select>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button variant="destructive" size="sm" onClick={() => openDialog('bulk-ban', '__bulk__')}>
            <Ban className="size-3.5" /> Ban Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-medium">
            {data ? `${data.pagination.total.toLocaleString()} users` : 'Users'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-10"><LoadingScreen /></div>
           : isError  ? <ErrorState message="Failed to load users" onRetry={refetch} />
           : (
            <>
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
                <input type="checkbox"
                  checked={!!data?.users.length && selected.size === data.users.length}
                  onChange={toggleAll} className="size-3.5 rounded accent-primary" />
                <span className="flex-1 text-xs font-medium text-muted-foreground">User</span>
                <span className="hidden sm:block w-20 text-xs font-medium text-muted-foreground">Sessions</span>
                <span className="hidden md:block w-28 text-xs font-medium text-muted-foreground">Last Login</span>
                <span className="w-20 text-xs font-medium text-muted-foreground">Role</span>
                <span className="w-7" />
              </div>

              {data?.users.map((user) => (
                <UserRow key={user.id} user={user}
                  selected={selected.has(user.id)}
                  onSelect={() => toggleSelect(user.id)}
                  onViewDetail={() => setDetailUser(user.id)}
                  onBan={() => openDialog('ban', user.id)}
                  onUnban={() => openDialog('unban', user.id)}
                  onSuspend={() => openDialog('suspend', user.id)}
                  onUnsuspend={() => openDialog('unsuspend', user.id)}
                  onDelete={() => openDialog('delete', user.id)}
                  onResetPassword={() => openDialog('resetPassword', user.id)}
                  onEditNotes={() => openDialog('notes', user.id)}
                  onMarkSuspicious={() => markSuspicious.mutate({ userId: user.id, isSuspicious: !user.isSuspicious })}
                  onChangeRole={(role) => changeRole.mutate({ userId: user.id, role })}
                  onExport={() => exportUser(user.id)}
                />
              ))}
              {!data?.users.length && (
                <p className="text-center text-sm text-muted-foreground py-10">No users found</p>
              )}

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Page {page} of {data.pagination.totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {detailUser && (
        <UserDetailPanel
          userId={detailUser}
          onClose={() => setDetailUser(null)}
          onBan={() => openDialog('ban', detailUser)}
          onUnban={() => openDialog('unban', detailUser)}
          onSuspend={() => openDialog('suspend', detailUser)}
          onUnsuspend={() => openDialog('unsuspend', detailUser)}
          onDelete={() => openDialog('delete', detailUser)}
        />
      )}

      <ActionDialog dialog={dialog} isPending={isPending}
        onChange={(field, val) => setDialog((p) => ({ ...p, [field]: val }))}
        onConfirm={handleConfirm} onClose={closeDialog} />
    </div>
  )
}

// ── User Row ───────────────────────────────────────────────────────────────

function UserRow({
  user, selected, onSelect, onViewDetail, onBan, onUnban,
  onSuspend, onUnsuspend, onDelete, onResetPassword,
  onEditNotes, onMarkSuspicious, onChangeRole, onExport,
}: {
  user: AdminUserListItem; selected: boolean
  onSelect: () => void; onViewDetail: () => void
  onBan: () => void; onUnban: () => void
  onSuspend: () => void; onUnsuspend: () => void
  onDelete: () => void; onResetPassword: () => void
  onEditNotes: () => void; onMarkSuspicious: () => void
  onChangeRole: (role: string) => void; onExport: () => void
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors',
      selected && 'bg-primary/5',
    )}>
      <input type="checkbox" checked={selected} onChange={onSelect}
        onClick={(e) => e.stopPropagation()}
        className="size-3.5 rounded accent-primary shrink-0" />
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs bg-muted">{getInitials(user.name || user.email)}</AvatarFallback>
      </Avatar>
      <button className="flex-1 min-w-0 text-left" onClick={onViewDetail}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
          {user.isBanned     && <Badge variant="destructive" className="text-xs py-0">Banned</Badge>}
          {user.isSuspended  && <Badge variant="warning"     className="text-xs py-0">Suspended</Badge>}
          {user.isSuspicious && <Badge className="text-xs py-0 bg-orange-500/10 text-orange-400 border-orange-500/20">Suspicious</Badge>}
          {!user.emailVerified && <Badge variant="secondary" className="text-xs py-0">Unverified</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </button>
      <span className="hidden sm:block w-20 text-xs text-muted-foreground tabular-nums">
        {user._count.interviewSessions}
      </span>
      <span className="hidden md:block w-28 text-xs text-muted-foreground">
        {user.lastLogin ? formatRelative(user.lastLogin) : '—'}
      </span>
      <span className="w-20"><RoleBadge role={user.role} /></span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 shrink-0">
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onViewDetail}><Eye className="size-3.5" /> View Details</DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.isBanned
            ? <DropdownMenuItem onClick={onUnban} className="text-green-400"><UserCheck className="size-3.5" /> Unban</DropdownMenuItem>
            : <DropdownMenuItem onClick={onBan} className="text-destructive"><Ban className="size-3.5" /> Ban User</DropdownMenuItem>
          }
          {user.isSuspended
            ? <DropdownMenuItem onClick={onUnsuspend}><ShieldOff className="size-3.5" /> Unsuspend</DropdownMenuItem>
            : <DropdownMenuItem onClick={onSuspend}><ShieldAlert className="size-3.5" /> Suspend</DropdownMenuItem>
          }
          <DropdownMenuSeparator />
          {['FREE','PREMIUM','ADMIN'].filter((r) => r !== user.role).map((role) => (
            <DropdownMenuItem key={role} onClick={() => onChangeRole(role)}>Make {role}</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onResetPassword}><Key className="size-3.5" /> Reset Password</DropdownMenuItem>
          <DropdownMenuItem onClick={onEditNotes}><StickyNote className="size-3.5" /> Edit Notes</DropdownMenuItem>
          <DropdownMenuItem onClick={onMarkSuspicious}>
            <AlertTriangle className="size-3.5" /> {user.isSuspicious ? 'Unmark' : 'Mark'} Suspicious
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}><Download className="size-3.5" /> Export Data</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── User Detail Panel ──────────────────────────────────────────────────────

function UserDetailPanel({
  userId, onClose, onBan, onUnban, onSuspend, onUnsuspend, onDelete,
}: {
  userId: string; onClose: () => void
  onBan: () => void; onUnban: () => void
  onSuspend: () => void; onUnsuspend: () => void; onDelete: () => void
}) {
  const { data, isLoading } = useAdminUserDetails(userId)
  const [tab, setTab] = useState<DetailTab>('overview')

  const DETAIL_TABS: { id: DetailTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview',     label: 'Overview',    icon: Eye      },
    { id: 'bans',         label: 'Bans',        icon: Ban,        count: data?.user.bans?.length          },
    { id: 'suspensions',  label: 'Suspensions', icon: ShieldAlert,count: data?.user.suspensions?.length   },
    { id: 'sessions',     label: 'Sessions',    icon: Wifi,       count: data?.user.refreshTokens?.length },
    { id: 'achievements', label: 'Achievements',icon: Trophy,     count: data?.user.achievements?.length  },
    { id: 'weak-areas',   label: 'Weak Areas',  icon: Brain,      count: data?.user.weakAreas?.length     },
  ]

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">User Detail</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <LoadingScreen /> : data ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="text-base bg-muted">
                  {getInitials(data.user.name || data.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{data.user.name}</p>
                <p className="text-sm text-muted-foreground">{data.user.email}</p>
                <p className="text-xs text-muted-foreground">Joined {formatDate(data.user.createdAt)}</p>
              </div>
              <RoleBadge role={data.user.role} />
            </div>

            {/* Sub-tab bar */}
            <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none">
              {DETAIL_TABS.map((t) => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                      tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}>
                    <Icon className="size-3" />
                    {t.label}
                    {t.count !== undefined && t.count > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{t.count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Interviews', value: data.stats.totalInterviews           },
                    { label: 'Avg Score',  value: `${data.stats.avgScore.toFixed(1)}`  },
                    { label: 'Streak',     value: data.stats.currentStreak             },
                    { label: 'Problems',   value: data.stats.questionsSolved           },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
                      <p className="text-lg font-bold tabular-nums text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                {data.user.adminNotes && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                    <p className="text-xs font-medium text-yellow-400 mb-1">Admin Notes</p>
                    <p className="text-sm text-foreground">{data.user.adminNotes}</p>
                  </div>
                )}
                {data.recentActivity.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {data.recentActivity.slice(0, 10).map((act) => (
                        <div key={act.id} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-foreground truncate flex-1">{act.action}</span>
                          <Badge variant={act.statusCode < 400 ? 'secondary' : 'destructive'} className="text-xs shrink-0">{act.statusCode}</Badge>
                          <span className="text-xs text-muted-foreground shrink-0">{formatRelative(act.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap pt-1">
                  {data.user.isBanned
                    ? <Button size="sm" variant="outline" className="text-green-400 border-green-400/20" onClick={onUnban}><UserCheck className="size-3.5" /> Unban</Button>
                    : <Button size="sm" variant="destructive" onClick={onBan}><Ban className="size-3.5" /> Ban</Button>
                  }
                  {data.user.isSuspended
                    ? <Button size="sm" variant="outline" onClick={onUnsuspend}><ShieldOff className="size-3.5" /> Unsuspend</Button>
                    : <Button size="sm" variant="outline" onClick={onSuspend}><ShieldAlert className="size-3.5" /> Suspend</Button>
                  }
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/20" onClick={onDelete}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Ban history (previously missing) */}
            {tab === 'bans' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!data.user.bans?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No ban history</p>
                ) : data.user.bans.map((ban) => (
                  <div key={ban.id} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={ban.isPermanent ? 'destructive' : 'secondary'} className="text-xs">
                        {ban.isPermanent ? 'Permanent' : 'Temporary'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(ban.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">"{ban.reason}"</p>
                    {ban.unbannedAt && (
                      <p className="text-xs text-green-400">Lifted {formatRelative(ban.unbannedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suspension history (previously missing) */}
            {tab === 'suspensions' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!data.user.suspensions?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No suspension history</p>
                ) : data.user.suspensions.map((sus) => (
                  <div key={sus.id} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-yellow-400 font-medium">{sus.duration}h suspension</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(sus.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">"{sus.reason}"</p>
                    <p className="text-xs text-muted-foreground">Expires: {formatDateTime(sus.expiresAt)}</p>
                    {sus.endedAt && (
                      <p className="text-xs text-green-400">Ended early {formatRelative(sus.endedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Active sessions (previously missing) */}
            {tab === 'sessions' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!data.user.refreshTokens?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No active sessions</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {data.user.refreshTokens.length} active refresh token{data.user.refreshTokens.length !== 1 ? 's' : ''}
                    </p>
                    {data.user.refreshTokens.map((token) => (
                      <div key={token.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-mono text-muted-foreground">{token.id.slice(0, 8)}…</p>
                          <p className="text-xs text-muted-foreground">Created {formatRelative(token.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Expires</p>
                          <p className="text-xs text-foreground">{formatRelative(token.expiresAt)}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Achievements (previously missing) */}
            {tab === 'achievements' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!data.user.achievements?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No achievements yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.user.achievements.map((ua) => (
                      <div key={ua.id} className="rounded-lg border border-border p-2.5 flex items-center gap-2">
                        <span className="text-xl">{ua.achievement.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ua.achievement.title}</p>
                          <p className="text-xs text-muted-foreground">{formatRelative(ua.unlockedAt)}</p>
                        </div>
                        <span className="ml-auto text-xs text-yellow-400 font-medium shrink-0">+{ua.achievement.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Weak areas (previously missing) */}
            {tab === 'weak-areas' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!data.user.weakAreas?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No weak areas identified</p>
                ) : data.user.weakAreas.map((wa, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{wa.topic}</span>
                      <Badge variant="destructive" className="text-xs">{wa.failureCount} fails</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{wa.category.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">Last seen {formatRelative(wa.lastEncountered)}</p>
                    {wa.improvementSuggestions.length > 0 && (
                      <p className="text-xs text-blue-400">💡 {wa.improvementSuggestions[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ── Action Dialog ──────────────────────────────────────────────────────────

type DialogField = keyof DialogState

function ActionDialog({
  dialog, isPending, onChange, onConfirm, onClose,
}: {
  dialog: DialogState; isPending: boolean
  onChange: (field: DialogField, val: string | number) => void
  onConfirm: () => void; onClose: () => void
}) {
  if (!dialog.type) return null
  const configs: Record<NonNullable<DialogType>, { title: string; description: string; confirmLabel: string; destructive?: boolean }> = {
    ban:           { title: 'Ban User?',        description: 'Revokes all sessions. User cannot log in.',    confirmLabel: 'Ban',       destructive: true  },
    unban:         { title: 'Unban User?',       description: 'User will regain access to their account.',   confirmLabel: 'Unban'                         },
    suspend:       { title: 'Suspend User?',     description: 'Temporarily restrict account access.',        confirmLabel: 'Suspend',   destructive: true  },
    unsuspend:     { title: 'Lift Suspension?',  description: 'Account access will be restored immediately.',confirmLabel: 'Unsuspend'                     },
    delete:        { title: 'Delete Account?',   description: 'Permanently deletes all data.',               confirmLabel: 'Delete',    destructive: true  },
    resetPassword: { title: 'Reset Password?',   description: 'Set a new password for this account.',        confirmLabel: 'Reset'                         },
    notes:         { title: 'Admin Notes',       description: 'Internal notes visible only to admins.',      confirmLabel: 'Save'                          },
    'bulk-ban':    { title: 'Bulk Ban Users?',   description: 'This will ban all selected users.',           confirmLabel: 'Ban All',   destructive: true  },
  }
  const cfg = configs[dialog.type]
  const needsReason   = ['ban','suspend','delete','bulk-ban'].includes(dialog.type)
  const needsDuration = dialog.type === 'suspend'
  const needsPassword = dialog.type === 'resetPassword'
  const needsNotes    = dialog.type === 'notes'
  const isValid       = needsReason ? dialog.reason.trim().length > 0 : needsPassword ? dialog.newPassword.length >= 8 : true

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{cfg.title}</AlertDialogTitle>
          <AlertDialogDescription>{cfg.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          {needsReason && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Reason *</label>
              <input value={dialog.reason} onChange={(e) => onChange('reason', e.target.value)} placeholder="Enter reason…"
                className="flex h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          )}
          {needsDuration && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Duration (hours)</label>
              <input type="number" min={1} max={8760} value={dialog.durationHours}
                onChange={(e) => onChange('durationHours', Number(e.target.value))}
                className="flex h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          )}
          {needsPassword && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">New Password (min 8 chars)</label>
              <input type="password" value={dialog.newPassword} onChange={(e) => onChange('newPassword', e.target.value)} placeholder="New password…"
                className="flex h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          )}
          {needsNotes && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea value={dialog.notes} onChange={(e) => onChange('notes', e.target.value)} rows={4} placeholder="Internal admin notes…"
                className="flex w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!isValid || isPending} onClick={onConfirm}
            className={cfg.destructive ? 'bg-destructive hover:bg-destructive/90' : ''}>
            {isPending ? 'Processing…' : cfg.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN:   'border-purple-500/30 bg-purple-500/10 text-purple-400',
    PREMIUM: 'border-primary/30 bg-primary/10 text-primary',
    FREE:    'border-border bg-secondary/50 text-muted-foreground',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', styles[role] ?? styles.FREE)}>
      {role}
    </span>
  )
}
