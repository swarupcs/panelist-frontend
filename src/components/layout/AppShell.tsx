import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Sidebar, MobileNav } from './Sidebar'
import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/cn'

function Header() {
  const { user } = useAuthStore()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-40">
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
        <Avatar className="size-8">
          <AvatarImage src={user?.profilePicture || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
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
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
        <main className={cn('flex-1', fillsViewport ? 'overflow-hidden' : 'overflow-y-auto')}>
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
