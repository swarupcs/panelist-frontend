// src/hooks/useAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminUserApi, adminAnalyticsApi, adminStatsApi } from '@/api/admin.api'
import type { UserFilterStatus, UserSortField } from '@/types/admin'

// ── Query Keys ─────────────────────────────────────────────────────────────

export const adminKeys = {
  all:         ['admin'] as const,
  stats:       ()           => [...adminKeys.all, 'stats']                   as const,
  users:       ()           => [...adminKeys.all, 'users']                   as const,
  userList:    (p: object)  => [...adminKeys.users(), p]                     as const,
  userDetail:  (id: string) => [...adminKeys.users(), id]                    as const,
  userActivity:(id: string) => [...adminKeys.users(), id, 'activity']        as const,
  actions:     (p: object)  => [...adminKeys.all, 'actions', p]              as const,
  analytics:   ()           => [...adminKeys.all, 'analytics']               as const,
  overview:    ()           => [...adminKeys.analytics(), 'overview']        as const,
  behavior:    ()           => [...adminKeys.analytics(), 'behavior']        as const,
  cohorts:     (m: number)  => [...adminKeys.analytics(), 'cohorts', m]      as const,
  apiUsage:    (h: number)  => [...adminKeys.analytics(), 'api-usage', h]    as const,
  errorLogs:   (p: object)  => [...adminKeys.analytics(), 'errors', p]       as const,
  health:      ()           => [...adminKeys.analytics(), 'health']          as const,
  performance: (h: number)  => [...adminKeys.analytics(), 'performance', h]  as const,
  reports:     (p: object)  => [...adminKeys.analytics(), 'reports', p]      as const,
}

// ============================================================
// Dashboard Stats
// ============================================================

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn:  adminStatsApi.getDashboardStats,
    staleTime: 1000 * 60 * 2,
  })
}

// ============================================================
// User Management
// ============================================================

export function useAdminUsers(params: {
  search?: string
  role?: string
  status?: UserFilterStatus
  emailVerified?: boolean
  isSuspicious?: boolean
  page?: number
  limit?: number
  sortBy?: UserSortField
  sortOrder?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: adminKeys.userList(params),
    queryFn:  () =>
      adminUserApi.getUsers({
        ...params,
        status: params.status === 'all' ? undefined : params.status,
      }),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  })
}

export function useAdminUserDetails(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.userDetail(userId ?? ''),
    queryFn:  () => adminUserApi.getUserDetails(userId!),
    enabled:  !!userId,
    staleTime: 1000 * 30,
  })
}

export function useAdminUserActivity(userId: string | null, limit = 50) {
  return useQuery({
    queryKey: adminKeys.userActivity(userId ?? ''),
    queryFn:  () => adminUserApi.getUserActivity(userId!, limit),
    enabled:  !!userId,
  })
}

export function useAdminActions(params: {
  adminId?: string
  targetUserId?: string
  action?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: adminKeys.actions(params),
    queryFn:  () => adminUserApi.getAdminActions(params),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  })
}

// ── Shared mutation factory ────────────────────────────────────────────────

function useUserMutation<TVariables>(
  mutationFn: (vars: TVariables) => Promise<unknown>,
  options?: { onSuccess?: () => void },
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() })
      qc.invalidateQueries({ queryKey: adminKeys.stats() })
      options?.onSuccess?.()
    },
  })
}

// ── Individual mutation hooks ──────────────────────────────────────────────

export function useBanUser(onSuccess?: () => void) {
  return useUserMutation(
    ({
      userId,
      reason,
      isPermanent = true,
    }: {
      userId: string
      reason: string
      isPermanent?: boolean
    }) => adminUserApi.banUser(userId, reason, isPermanent),
    { onSuccess },
  )
}

export function useUnbanUser(onSuccess?: () => void) {
  return useUserMutation((userId: string) => adminUserApi.unbanUser(userId), {
    onSuccess,
  })
}

export function useSuspendUser(onSuccess?: () => void) {
  return useUserMutation(
    ({
      userId,
      reason,
      durationHours,
    }: {
      userId: string
      reason: string
      durationHours: number
    }) => adminUserApi.suspendUser(userId, reason, durationHours),
    { onSuccess },
  )
}

export function useUnsuspendUser(onSuccess?: () => void) {
  return useUserMutation(
    (userId: string) => adminUserApi.unsuspendUser(userId),
    { onSuccess },
  )
}

export function useChangeUserRole(onSuccess?: () => void) {
  return useUserMutation(
    ({ userId, role }: { userId: string; role: string }) =>
      adminUserApi.changeRole(userId, role),
    { onSuccess },
  )
}

export function useResetUserPassword(onSuccess?: () => void) {
  return useUserMutation(
    ({
      userId,
      newPassword,
    }: {
      userId: string
      newPassword: string
    }) => adminUserApi.resetPassword(userId, newPassword),
    { onSuccess },
  )
}

export function useDeleteUser(onSuccess?: () => void) {
  return useUserMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      adminUserApi.deleteUser(userId, reason),
    { onSuccess },
  )
}

export function useUpdateAdminNotes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes: string }) =>
      adminUserApi.updateNotes(userId, notes),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
    },
  })
}

export function useMarkSuspicious() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      isSuspicious,
    }: {
      userId: string
      isSuspicious: boolean
    }) => adminUserApi.markSuspicious(userId, isSuspicious),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useBulkBanUsers(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      userIds,
      reason,
    }: {
      userIds: string[]
      reason: string
    }) => adminUserApi.bulkBanUsers(userIds, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() })
      qc.invalidateQueries({ queryKey: adminKeys.stats() })
      onSuccess?.()
    },
  })
}

// ============================================================
// Analytics
// ============================================================

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn:  adminAnalyticsApi.getSystemOverview,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAdminUserBehavior() {
  return useQuery({
    queryKey: adminKeys.behavior(),
    queryFn:  adminAnalyticsApi.getUserBehavior,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAdminCohorts(months = 6) {
  return useQuery({
    queryKey: adminKeys.cohorts(months),
    queryFn:  () => adminAnalyticsApi.getCohortAnalysis(months),
    staleTime: 1000 * 60 * 10,
  })
}

export function useAdminApiUsage(hours = 24) {
  return useQuery({
    queryKey: adminKeys.apiUsage(hours),
    queryFn:  () => adminAnalyticsApi.getApiUsage(hours),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  })
}

export function useAdminErrorLogs(params: {
  level?: string
  hours?: number
  resolved?: boolean
  limit?: number
}) {
  return useQuery({
    queryKey: adminKeys.errorLogs(params),
    queryFn:  () => adminAnalyticsApi.getErrorLogs(params),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useAdminSystemHealth() {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn:  adminAnalyticsApi.getSystemHealth,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  })
}

export function useAdminPerformance(hours = 24) {
  return useQuery({
    queryKey: adminKeys.performance(hours),
    queryFn:  () => adminAnalyticsApi.getPerformanceMetrics(hours),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  })
}

export function useAdminReports(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.reports({ page, limit }),
    queryFn:  () => adminAnalyticsApi.getReports(page, limit),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  })
}

export function useResolveError() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (errorId: string) => adminAnalyticsApi.resolveError(errorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.analytics() })
    },
  })
}

export function useGenerateReport(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      type: string
      startDate: string
      endDate: string
      metrics: string[]
      format: string
    }) => adminAnalyticsApi.generateReport(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.analytics() })
      onSuccess?.()
    },
  })
}
