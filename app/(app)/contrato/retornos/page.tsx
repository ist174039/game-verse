import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContractReturnsClient } from '@/components/investments/contract-returns-client'

export default async function ContractReturnsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <ContractReturnsClient userId={user.id} />
}
