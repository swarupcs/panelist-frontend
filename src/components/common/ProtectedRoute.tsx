import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/common'
import { useCurrentUser } from '@/hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const { isLoading } = useCurrentUser()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isLoading) {
    return <LoadingScreen message="Authenticating..." />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { user } = useAuthStore()
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
