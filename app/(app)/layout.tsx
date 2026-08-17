import { createClient } from '@/lib/supabase/server'
import { hasSupabasePublicConfig } from '@/lib/supabase/config'
import { redirect } from 'next/navigation'
import { Database, Settings, ShieldAlert } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'

const INTERNAL_ROLES = new Set(['super_admin', 'platform_admin', 'economy_admin', 'competition_admin', 'moderator', 'support_agent', 'finance_operator', 'read_only_analyst'])

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabasePublicConfig()) return <BackendConfigurationRequired />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const isGuest = user.is_anonymous || false
  const [profileResult,goldResult] = !isGuest
    ? await Promise.all([
        supabase.from('user_profile').select('username').eq('id', user.id).maybeSingle(),
        supabase.from('user_currency_account').select('balance').eq('user_id',user.id).eq('currency','GOLD').maybeSingle(),
      ])
    : [{data:null},{data:null}]
  const username = profileResult.data?.username || user.email?.split('@')[0] || 'Manager'
  const goldBalance = Number(goldResult.data?.balance ?? 0)
  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  const hasInternalAccess = Boolean(role && INTERNAL_ROLES.has(role))

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar username={username} goldBalance={goldBalance} isGuest={isGuest} hasInternalAccess={hasInternalAccess} />
      <main className="pb-[calc(4.6rem+env(safe-area-inset-bottom))] pt-16 lg:pb-0 lg:pl-[17rem] lg:pt-0">
        <div className="brand-watermark mx-auto min-h-screen w-full max-w-[1680px] px-4 py-5 sm:px-5 lg:px-8 lg:py-7 xl:px-10">{children}</div>
      </main>
    </div>
  )
}

function BackendConfigurationRequired() {
  return <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10"><section className="w-full max-w-3xl rounded-2xl border border-primary/15 bg-[#0b0b0b] p-6 sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary"><Database className="h-5 w-5" /></div><div className="mt-5 flex items-center gap-2 text-primary"><ShieldAlert className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Backend não configurado</p></div><h1 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">O Clã das Sombras precisa do Supabase de produção.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">As variáveis públicas do Supabase não estão disponíveis neste ambiente. As áreas autenticadas permanecem bloqueadas até a configuração estar completa.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><ConfigItem name="NEXT_PUBLIC_SUPABASE_URL" /><ConfigItem name="NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" /></div><div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary"/><p className="text-sm font-black">Servidor</p></div><p className="mt-2 text-xs leading-5 text-muted-foreground">O Admin utiliza também <code className="text-foreground">SUPABASE_SECRET_KEY</code> exclusivamente no servidor; <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> continua suportada como fallback.</p></div></section></main>
}
function ConfigItem({ name }: { name: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Variável necessária</p><code className="mt-1 block break-all text-xs font-semibold text-foreground">{name}</code></div> }
