import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BuyGameCoinsClient } from '@/components/economy/buy-gamecoins-client'

export default async function BuyGameCoinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: packages } = await supabase
    .from('coin_package')
    .select('*')
    .eq('active', true)
    .order('price_cents', { ascending: true })

  return (
    <BuyGameCoinsClient
      userId={user.id}
      packages={packages || []}
    />
  )
}
