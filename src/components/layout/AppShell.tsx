import { Outlet } from 'react-router-dom'
import { Sidebar, MobileNav } from './Sidebar'
import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'

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

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
