'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Trophy, Shield, Coins, BarChart3, Gamepad2, Swords, Store, Users, LogOut, Menu, X, Gavel, ShieldAlert, Globe, CalendarDays, TrendingUp, PiggyBank, MessageCircle } from 'lucide-react'
import { useState } from 'react'

interface NavItem { label: string; href: string; icon: React.ReactNode; badge?: string }
const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
  { label: 'Meu Clube', href: '/club', icon: <Shield className="h-[18px] w-[18px]" /> },
  { label: 'Plantel', href: '/team', icon: <Users className="h-[18px] w-[18px]" /> },
  { label: 'Jogar', href: '/play', icon: <Gamepad2 className="h-[18px] w-[18px]" /> },
  { label: 'Competições', href: '/tournaments', icon: <Swords className="h-[18px] w-[18px]" /> },
  { label: 'Ranking', href: '/rankings', icon: <BarChart3 className="h-[18px] w-[18px]" /> },
]
const secondaryNavItems: NavItem[] = [
  { label: 'Economia', href: '/economy', icon: <Coins className="h-[18px] w-[18px]" /> },
  { label: 'Comprar Gold', href: '/economy/buy', icon: <Coins className="h-[18px] w-[18px]" /> },
  { label: 'Mercado', href: '/market', icon: <Store className="h-[18px] w-[18px]" /> },
  { label: 'Leilões', href: '/market/auction', icon: <Gavel className="h-[18px] w-[18px]" /> },
  { label: 'Social', href: '/social', icon: <Users className="h-[18px] w-[18px]" /> },
  { label: 'Comunidades', href: '/community', icon: <Globe className="h-[18px] w-[18px]" /> },
  { label: 'Chat', href: '/community/chat', icon: <MessageCircle className="h-[18px] w-[18px]" /> },
  { label: 'Universos', href: '/universos', icon: <Globe className="h-[18px] w-[18px]" /> },
  { label: 'Calendário', href: '/calendar', icon: <CalendarDays className="h-[18px] w-[18px]" /> },
]
const financeNavItems: NavItem[] = [
  { label: 'Investimentos', href: '/investimento', icon: <TrendingUp className="h-[18px] w-[18px]" /> },
  { label: 'Património', href: '/patrimonio', icon: <PiggyBank className="h-[18px] w-[18px]" /> },
  { label: 'Ativos', href: '/activos', icon: <Coins className="h-[18px] w-[18px]" /> },
  { label: 'Passivos', href: '/passivos', icon: <BarChart3 className="h-[18px] w-[18px]" /> },
]
const adminNavItems: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: <Shield className="h-[18px] w-[18px]" /> },
  { label: 'Backoffice', href: '/admin/backoffice', icon: <ShieldAlert className="h-[18px] w-[18px]" /> },
]

interface AppSidebarProps { username?: string; balance?: number; isGuest?: boolean }

export function AppSidebar({ username = 'Manager', balance = 0, isGuest = false }: AppSidebarProps) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false)
  const handleLogout = async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push('/auth/login') }
  const NavContent = () => <>
    <div className="mb-6 flex items-center gap-3 px-1">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-primary/15 bg-black shadow-[0_0_20px_rgba(245,191,22,.08)]"><Image src="/brand/clan-logo.svg" alt="Clã das Sombras" fill className="object-cover" priority /></div>
      <div className="min-w-0"><h1 className="truncate text-sm font-extrabold tracking-tight text-foreground">CLÃ DAS SOMBRAS</h1><p className="text-[10px] font-medium uppercase tracking-[.14em] text-primary/80">Gestão · Competição</p></div>
    </div>
    {isGuest && <div className="mb-4 rounded-xl border border-primary/15 bg-primary/[.045] p-3"><div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-primary"/><span className="text-xs font-semibold text-primary">Modo visitante</span></div><p className="mt-1 text-[10px] text-muted-foreground">Explora a plataforma. Entra para competir.</p></div>}
    <div className="mb-5 rounded-xl border border-white/[.045] bg-white/[.025] p-3">
      <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Gold</span>{!isGuest && <Link href="/economy" className="text-[10px] font-semibold text-primary hover:text-primary/80">Economia</Link>}</div>
      <div className="mt-1 flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-primary/10"><Coins className="h-3 w-3 text-primary"/></span><span className="font-bold tabular-nums text-foreground">{balance.toLocaleString()}</span><span className="text-[10px] text-muted-foreground">saldo</span></div>
    </div>
    <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
      <NavGroup title="Clube" items={mainNavItems} pathname={pathname} close={()=>setMobileOpen(false)} />
      <NavGroup title="Plataforma" items={secondaryNavItems} pathname={pathname} close={()=>setMobileOpen(false)} />
      <NavGroup title="Finanças" items={financeNavItems} pathname={pathname} close={()=>setMobileOpen(false)} />
      <div className="my-3 h-px bg-white/[.05]"/><div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-muted-foreground/60">Operações</div>{adminNavItems.map(item=><NavLink key={item.href} item={item} pathname={pathname} close={()=>setMobileOpen(false)} destructive />)}
    </nav>
    <div className="mt-4 border-t border-white/[.055] pt-4"><Link href="/profile" className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[.035]"><div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold text-primary">{username.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{username}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Manager</p></div></Link><Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}><LogOut className="h-[18px] w-[18px]"/>Sair</Button></div>
  </>
  return <><div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[.055] bg-[#070707]/95 px-4 backdrop-blur-xl lg:hidden"><div className="flex items-center gap-2.5"><div className="relative h-9 w-9 overflow-hidden rounded-lg"><Image src="/brand/clan-logo.svg" alt="Clã das Sombras" fill className="object-cover" priority /></div><span className="text-xs font-extrabold tracking-tight">CLÃ DAS SOMBRAS</span></div><Button variant="ghost" size="icon" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X className="h-5 w-5"/>:<Menu className="h-5 w-5"/>}</Button></div>{mobileOpen&&<div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden" onClick={()=>setMobileOpen(false)}/>}<aside className={cn('fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[18rem] transform border-r border-white/[.055] bg-[#080808] p-4 transition-transform duration-200 lg:hidden',mobileOpen?'translate-x-0':'-translate-x-full')}><div className="flex h-full flex-col"><NavContent/></div></aside><aside className="fixed left-0 top-0 z-30 hidden h-screen w-[17rem] border-r border-white/[.055] bg-[#080808] p-4 lg:block"><div className="flex h-full flex-col"><NavContent/></div></aside></>
}

function NavGroup({title,items,pathname,close}:{title:string;items:NavItem[];pathname:string;close:()=>void}) { return <div className="mb-4"><div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-muted-foreground/60">{title}</div>{items.map(item=><NavLink key={item.href} item={item} pathname={pathname} close={close}/>)}</div> }
function NavLink({item,pathname,close,destructive=false}:{item:NavItem;pathname:string;close:()=>void;destructive?:boolean}) { const active=pathname===item.href||pathname.startsWith(item.href+'/'); return <Link href={item.href} onClick={close} className={cn('group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',active?(destructive?'bg-destructive/10 text-destructive':'bg-primary/[.09] text-primary shadow-[inset_2px_0_0_#f5bf16]'):'text-[#aaa69e] hover:bg-white/[.035] hover:text-foreground')}><span className={cn('transition-colors',active&&!destructive?'text-primary':'text-[#77736c] group-hover:text-foreground')}>{item.icon}</span><span>{item.label}</span>{item.badge&&<span className="ml-auto rounded bg-white/[.05] px-1.5 py-.5 text-[9px]">{item.badge}</span>}</Link> }
