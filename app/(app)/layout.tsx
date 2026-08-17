import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  // Allow guest users (anonymous) to browse, but redirect non-authenticated
  if (!user) {
    redirect('/auth/login')
  }

  const isGuest = user.is_anonymous || false

  // Get user profile and wallet (guests won't have these, use defaults)
  const profileResult = !isGuest
    ? await supabase.from('user_profile').select('*').eq('id', user.id).single()
    : { data: null }
  
  const walletResult = !isGuest
    ? await supabase.from('wallet').select('*').eq('user_id', user.id).single()
    : { data: null }

  const username = profileResult.data?.username || user.email?.split('@')[0] || 'Guest'
  const balance = walletResult.data?.balance || 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar username={username} balance={balance} isGuest={isGuest} />
      <main className="pt-14 lg:pt-0 lg:pl-64">
        <div className="min-h-screen p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
