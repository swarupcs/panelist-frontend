import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar, MobileNav } from './Sidebar'
import { Bell, Search, User, LogOut, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/cn'

function Header() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  const handleLogout = async () => {
    try {
      // No token passed: the refresh token is an httpOnly cookie the browser
      // sends with the request, so this code neither has nor needs it.
      await authApi.logout()
    } catch {
      // Already signed out locally either way — a failed call here must not
      // leave someone stuck in a session they asked to end.
    }
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-40 print:hidden">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm text-muted-foreground w-60">
          <Search className="size-3.5 shrink-0" />
          <span className="text-xs">Search...</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
        </button>
        {/* The avatar was a plain image: no handler, no link, no menu, so
            clicking the one control that looks like an account button did
            nothing at all. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-8">
              <AvatarImage src={user?.profilePicture || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name ?? 'Signed in'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/analytics')}>
              <BarChart3 className="size-4" />
              Analytics
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/**
 * Routes that fill the shell and scroll their own contents.
 *
 * Opt-in rather than automatic: it changes which element owns scrolling, and
 * a page that expected the shell to scroll it would simply be cut off.
 */
const VIEWPORT_HEIGHT_ROUTES = ['/chat']

export function AppShell() {
  const { user } = useAuthStore()
  const { pathname } = useLocation()

  const fillsViewport = VIEWPORT_HEIGHT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (user && user.hasOnboarded === false) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible">
      <div className="hidden md:flex print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible">
        <Header />
        {/* Two shapes, chosen per route.
            Ordinary pages grow and let main scroll them. A page that scrolls
            a region of itself — a chat transcript above a fixed composer —
            needs the opposite: an ancestor with a capped height to scroll
            inside. main is the only element here with one, and this wrapper
            was breaking the chain, because a block box is as tall as its
            content and so grows without limit. Capping it turns the chat's
            flex-1 into a real constraint; a minimum would not, which is the
            mistake that let the composer slide off the bottom. */}
        <main className={cn('flex-1 print:overflow-visible', fillsViewport ? 'overflow-hidden' : 'overflow-y-auto')}>
          <div
            className={cn(
              'mx-auto w-full max-w-7xl p-4 md:p-6',
              fillsViewport && 'flex h-full min-h-0 flex-col',
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
