import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'

const INTERNAL_ROLES = new Set(['super_admin', 'platform_admin', 'economy_admin', 'competition_admin', 'moderator', 'support_agent', 'finance_operator', 'read_only_analyst'])

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const isGuest = user.is_anonymous || false
  const profileResult = !isGuest ? await supabase.from('user_profile').select('*').eq('id', user.id).single() : { data: null }
  const walletResult = !isGuest ? await supabase.from('wallet').select('*').eq('user_id', user.id).single() : { data: null }
  const username = profileResult.data?.username || user.email?.split('@')[0] || 'Manager'
  const balance = walletResult.data?.balance || 0
  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  const hasInternalAccess = Boolean(role && INTERNAL_ROLES.has(role))

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar username={username} balance={balance} isGuest={isGuest} hasInternalAccess={hasInternalAccess} />
      <main className="pb-[calc(4.6rem+env(safe-area-inset-bottom))] pt-16 lg:pb-0 lg:pl-[17rem] lg:pt-0">
        <div className="brand-watermark mx-auto min-h-screen w-full max-w-[1680px] px-4 py-5 sm:px-5 lg:px-8 lg:py-7 xl:px-10">
          {children}
        </div>
      </main>
    </div>
  )
}
