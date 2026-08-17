'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Trophy,
  Shield,
  Coins,
  BarChart3,
  Gamepad2,
  Swords,
  Store,
  Users,
  LogOut,
  Menu,
  X,
  Gavel,
  ShieldAlert,
  Globe,
  CalendarDays,
  TrendingUp,
  PiggyBank,
  MessageCircle,
  Gamepad2,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Club', href: '/club', icon: <Shield className="h-5 w-5" /> },
  { label: 'Team', href: '/team', icon: <Users className="h-5 w-5" /> },
  { label: 'Play', href: '/play', icon: <Gamepad2 className="h-5 w-5" /> },
  { label: 'Tournaments', href: '/tournaments', icon: <Swords className="h-5 w-5" /> },
  { label: 'Rankings', href: '/rankings', icon: <BarChart3 className="h-5 w-5" /> },
]

const secondaryNavItems: NavItem[] = [
  { label: 'Economy', href: '/economy', icon: <Coins className="h-5 w-5" /> },
  { label: 'Buy GC', href: '/economy/buy', icon: <Coins className="h-5 w-5" /> },
  { label: 'Market', href: '/market', icon: <Store className="h-5 w-5" /> },
  { label: 'Auction', href: '/market/auction', icon: <Gavel className="h-5 w-5" /> },
  { label: 'Social', href: '/social', icon: <Users className="h-5 w-5" /> },
  { label: 'Community', href: '/community', icon: <Globe className="h-5 w-5" /> },
  { label: 'Chat', href: '/community/chat', icon: <MessageCircle className="h-5 w-5" /> },
  { label: 'Universos', href: '/universos', icon: <Globe className="h-5 w-5" /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarDays className="h-5 w-5" /> },
]

const financeNavItems: NavItem[] = [
  { label: 'Investments', href: '/investimento', icon: <TrendingUp className="h-5 w-5" /> },
  { label: 'Patrimony', href: '/patrimonio', icon: <PiggyBank className="h-5 w-5" /> },
  { label: 'Assets', href: '/activos', icon: <Coins className="h-5 w-5" /> },
  { label: 'Liabilities', href: '/passivos', icon: <BarChart3 className="h-5 w-5" /> },
]

const adminNavItems: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: <Shield className="h-5 w-5" /> },
  { label: 'Backoffice', href: '/admin/backoffice', icon: <ShieldAlert className="h-5 w-5" /> },
]

interface AppSidebarProps {
  username?: string
  balance?: number
  isGuest?: boolean
}

export function AppSidebar({ username = 'Manager', balance = 0, isGuest = false }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">GameVerse</h1>
          <p className="text-xs text-muted-foreground">Football Manager</p>
        </div>
      </div>

      {/* Guest Badge */}
      {isGuest && (
        <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Guest Mode</span>
          </div>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
            Browse freely. Sign in to play &amp; compete.
          </p>
        </div>
      )}

      {/* Wallet Quick View */}
      <div className="mb-6 rounded-lg bg-secondary/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Balance</span>
          {!isGuest && (
            <Link href="/economy" className="text-xs text-primary hover:underline">
              + Add
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{balance.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">GC</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
          Main
        </div>
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <div className="my-4 border-t border-border" />

        <div className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
          More
        </div>
        {secondaryNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <div className="my-4 border-t border-border" />

        <div className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
          Finance
        </div>
        {financeNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <div className="my-4 border-t border-border" />

        <div className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
          Admin
        </div>
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-destructive/10 text-destructive font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t border-border pt-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-2 mb-3 rounded-lg transition-colors hover:bg-secondary/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{username}</p>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground">GameVerse</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1.5">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{balance.toLocaleString()}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-64 transform border-r border-border bg-sidebar p-4 transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <NavContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar p-4 lg:block">
        <div className="flex h-full flex-col">
          <NavContent />
        </div>
      </aside>
    </>
  )
}
