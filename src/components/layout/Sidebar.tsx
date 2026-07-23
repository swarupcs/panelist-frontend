// src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Code2,
  BarChart3,
  BookOpen,
  Building2,
  Hash,
  Trophy,
  User,
  Shield,
  Brain,
  History,
  FileSearch,
  MessageSquare,
  Users,
  BookUser,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { ViewSwitcher } from './ViewSwitcher';
import { useAvailableViews } from '@/hooks/useRecruiter';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { getStorageItem, getInitials } from '@/utils/formatters';
import type { AuthTokens } from '@/types';
import { cn } from '@/lib/cn';

// ── Nav items ──────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/interview', icon: Code2, label: 'Interview' },
  { to: '/resume-review', icon: FileSearch, label: 'Resume Review' },
  { to: '/chat', icon: MessageSquare, label: 'AI Coach' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/learning', icon: BookOpen, label: 'Learning' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/topics', icon: Hash, label: 'Topics' },
  { to: '/forum', icon: Users, label: 'Community' },
  { to: '/groups', icon: BookUser, label: 'Study Groups' },
  { to: '/interview/history', icon: History, label: 'History' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
];

/** Shown only in the hiring view. */
const RECRUITER_NAV: NavItem[] = [
  { to: '/recruiter', icon: Briefcase, label: 'Hiring' },
];

// ── Nav link item ──────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  collapsed = false,
  onClick,
}: {
  item: NavItem;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      end={item.to === '/interview'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          collapsed && 'justify-center px-2',
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon className='size-4 shrink-0' />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

// ── Logo ───────────────────────────────────────────────────────────────────

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}
    >
      <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 shrink-0'>
        <Brain className='size-5 text-primary' />
      </div>
      {!collapsed && (
        <div>
          <p className='text-sm font-bold text-foreground leading-tight'>
            Panelist
          </p>
          <p className='text-[10px] text-muted-foreground leading-tight'>
            Interviews
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      // No token passed: the refresh token is an httpOnly cookie the browser
      // sends with the request, so this code neither has nor needs it.
      await authApi.logout();
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login');
  };

  const { view, isRecruiter } = useAvailableViews();

  // In the hiring view the practice nav is not just irrelevant, it is
  // confusing: streaks and readiness scores belong to the other product.
  const visibleItems = (view === 'recruiter' && isRecruiter
    ? RECRUITER_NAV
    : NAV_ITEMS
  ).filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN',
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-200',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className='flex h-14 items-center justify-between px-3 border-b border-border'>
        <Logo collapsed={collapsed} />
        <button
          type='button'
          onClick={() => setCollapsed((c) => !c)}
          className='rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            className={cn(
              'size-4 transition-transform',
              !collapsed && 'rotate-180',
            )}
          />
        </button>
      </div>

      {/* Practice or hiring. Renders nothing unless the account has both. */}
      <div className='px-2 pt-2'>
        <ViewSwitcher collapsed={collapsed} />
      </div>

      {/* Nav items */}
      <nav className='flex-1 overflow-y-auto p-2 space-y-0.5'>
        {visibleItems.map((item) => (
          <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-border p-2 space-y-0.5')}>
        {!collapsed && user && (
          <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 mb-1'>
            <div className='flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0'>
              {getInitials(user.name)}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium text-foreground truncate'>
                {user.name}
              </p>
              <p className='text-[10px] text-muted-foreground truncate'>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          type='button'
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground',
            'hover:bg-destructive/10 hover:text-destructive transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className='size-4 shrink-0' />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  );
}

// ── Mobile nav ─────────────────────────────────────────────────────────────

export function MobileNav() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // No token passed: the refresh token is an httpOnly cookie the browser
      // sends with the request, so this code neither has nor needs it.
      await authApi.logout();
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login');
    setOpen(false);
  };

  const { view, isRecruiter } = useAvailableViews();

  // In the hiring view the practice nav is not just irrelevant, it is
  // confusing: streaks and readiness scores belong to the other product.
  const visibleItems = (view === 'recruiter' && isRecruiter
    ? RECRUITER_NAV
    : NAV_ITEMS
  ).filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN',
  );

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
      >
        <Menu className='size-5' />
      </button>

      {open && (
        <div className='fixed inset-0 z-50 flex'>
          {/* Backdrop */}
          <button
            type='button'
            onClick={() => setOpen(false)}
            className='absolute inset-0 bg-background/80 backdrop-blur-sm'
            aria-label='Close menu'
          />

          {/* Drawer */}
          <div className='relative flex flex-col w-64 h-full bg-card border-r border-border shadow-xl'>
            {/* Header */}
            <div className='flex h-14 items-center justify-between px-4 border-b border-border'>
              <Logo />
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
              >
                <X className='size-4' />
              </button>
            </div>

            {/* Nav */}
            <nav className='flex-1 overflow-y-auto p-3 space-y-0.5'>
              {visibleItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>

            {/* User + logout */}
            <div className='border-t border-border p-3 space-y-1'>
              {user && (
                <div className='flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 mb-1'>
                  <div className='flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0'>
                    {getInitials(user.name)}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-foreground truncate'>
                      {user.name}
                    </p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
              <button
                type='button'
                onClick={handleLogout}
                className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors'
              >
                <LogOut className='size-4' />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
