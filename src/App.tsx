// src/App.tsx
// EXTENSIONS
// ─────────────────────────────────────────────────────────────────────────────
// ROUTE-1  /interview/replay/:sessionId   → InterviewReplayPage
// ROUTE-2  /interview/history            → InterviewHistoryPage
// ROUTE-3  /interview/compare            → InterviewComparePage
// All placed BEFORE the /:sessionId catch-all so Express-style matching works.

import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import {
  ProtectedRoute,
  AdminRoute,
  GuestRoute,
} from '@/components/common/ProtectedRoute';
import { LoadingScreen } from '@/components/common';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const InterviewSetupPage = lazy(
  () => import('@/pages/interview/InterviewSetupPage'),
);
const InterviewSessionPage = lazy(
  () => import('@/pages/interview/InterviewSessionPage'),
);
const InterviewResultsPage = lazy(
  () => import('@/pages/interview/InterviewResultsPage'),
);

// ── NEW pages ──────────────────────────────────────────────────────────────
const InterviewReplayPage = lazy(
  () => import('@/pages/interview/InterviewReplayPage'),
);
const InterviewHistoryPage = lazy(
  () => import('@/pages/interview/InterviewHistoryPage'),
);
const InterviewComparePage = lazy(
  () => import('@/pages/interview/InterviewComparePage'),
);
// ──────────────────────────────────────────────────────────────────────────

const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const LearningPage = lazy(() => import('@/pages/learning/LearningPage'));
const CompaniesPage = lazy(() => import('@/pages/companies/CompaniesPage'));
const TopicsPage = lazy(() => import('@/pages/topics/TopicsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const AchievementsPage = lazy(() => import('@/pages/profile/AchievementsPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen message='Loading page...' />}>
      <Routes>
        {/* ── Guest-only ────────────────────────────────────────────── */}
        <Route element={<GuestRoute />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        </Route>

        {/* ── Authenticated ─────────────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path='/dashboard' element={<DashboardPage />} />

            {/* ── Interview routes ────────────────────────────────────
                ORDER MATTERS: static segments must come before /:sessionId
            ─────────────────────────────────────────────────────────── */}

            {/* Setup (no param) */}
            <Route path='/interview' element={<InterviewSetupPage />} />

            {/* Static-prefix routes — BEFORE /:sessionId */}
            <Route
              path='/interview/history'
              element={<InterviewHistoryPage />}
            />
            <Route
              path='/interview/compare'
              element={<InterviewComparePage />}
            />

            {/* Results — static prefix "results" before dynamic :sessionId */}
            <Route
              path='/interview/results/:sessionId'
              element={<InterviewResultsPage />}
            />

            {/* ROUTE-1: Replay */}
            <Route
              path='/interview/replay/:sessionId'
              element={<InterviewReplayPage />}
            />

            {/* Dynamic :sessionId — MUST be last */}
            <Route
              path='/interview/:sessionId'
              element={<InterviewSessionPage />}
            />

            {/* ── Other pages ───────────────────────────────────────── */}
            <Route path='/analytics' element={<AnalyticsPage />} />
            <Route path='/learning' element={<LearningPage />} />
            <Route path='/companies' element={<CompaniesPage />} />
            <Route path='/topics' element={<TopicsPage />} />
            <Route path='/achievements' element={<AchievementsPage />} />
            <Route path='/profile' element={<ProfilePage />} />

            <Route element={<AdminRoute />}>
              <Route path='/admin' element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Fallbacks ─────────────────────────────────────────────── */}
        <Route path='/' element={<Navigate to='/dashboard' replace />} />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initFromStorage } = useAuthStore();
  useEffect(() => {
    initFromStorage();
  }, []);
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
