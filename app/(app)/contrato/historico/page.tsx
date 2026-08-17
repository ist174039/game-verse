import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContractHistoryClient } from '@/components/investments/contract-history-client'

export default async function ContractHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <ContractHistoryClient userId={user.id} />
}
