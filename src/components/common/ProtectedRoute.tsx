// src/components/common/ProtectedRoute.tsx
//
// FIX: wait for isInitialized before redirecting
// ─────────────────────────────────────────────────────────────────────────────
// Previously: isAuthenticated starts false → ProtectedRoute redirects to
// /login before AuthInitializer's useEffect can call initFromStorage().
//
// Now: if isInitialized is false (storage not read yet), show LoadingScreen.
// Once initFromStorage() runs (synchronous, inside a useEffect on the very
// next tick), isInitialized flips to true and the real auth check runs —
// by which point isAuthenticated is correctly set from storage.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/common';
import { useCurrentUser } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();
  const { isLoading } = useCurrentUser();

  // FIX: block until storage has been read — prevents the redirect race
  if (!isInitialized) {
    return <LoadingScreen message='Loading...' />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  if (isLoading) {
    return <LoadingScreen message='Authenticating...' />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user } = useAuthStore();
  if (user?.role !== 'ADMIN') {
    return <Navigate to='/dashboard' replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // FIX: same guard — don't redirect guests until we know auth state
  if (!isInitialized) {
    return <LoadingScreen message='Loading...' />;
  }

  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }

  return <Outlet />;
}
