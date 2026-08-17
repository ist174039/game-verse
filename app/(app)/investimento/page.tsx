import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvestmentClient } from '@/components/investments/investment-client'

export default async function InvestimentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <InvestmentClient userId={user.id} />
}
