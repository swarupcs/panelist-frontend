import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Code2, BarChart3, BookOpen, User,
  Trophy, Settings, LogOut, Brain, ChevronRight, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/interview', icon: Code2, label: 'Interview' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/learning', icon: BookOpen, label: 'Learning Path' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const adminItems = [
  { to: '/admin', icon: Settings, label: 'Admin Panel' },
]

function NavItem({ to, icon: Icon, label, collapsed }: {
  to: string; icon: React.ElementType; label: string; collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          'hover:bg-secondary hover:text-foreground',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground',
          collapsed && 'justify-center px-2',
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuthStore()
  const logout = useLogout()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border', collapsed && 'justify-center px-2')}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <Brain className="size-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">AI Coach</p>
            <p className="text-xs text-muted-foreground truncate">Interview Prep</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className={cn('my-2 h-px bg-border', collapsed && 'mx-2')} />
            {adminItems.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User area */}
      <div className="border-t border-border p-2 space-y-1">
        <div className={cn('flex items-center gap-3 rounded-lg px-3 py-2', collapsed && 'justify-center px-2')}>
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={user?.profilePicture || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => logout.mutate()}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors',
            collapsed && 'justify-center px-2',
          )}
        >
          <ChevronRight className={cn('size-4 shrink-0 transition-transform', !collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { user } = useAuthStore()
  const logout = useLogout()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center size-9 rounded-lg hover:bg-secondary text-muted-foreground"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative z-50 flex flex-col w-72 h-full bg-card border-r border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg gradient-primary">
                  <Brain className="size-4 text-white" />
                </div>
                <p className="font-bold text-foreground">AI Coach</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      'hover:bg-secondary hover:text-foreground',
                      isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-border p-3">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{user?.email}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => logout.mutate()}>
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
