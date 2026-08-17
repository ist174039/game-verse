import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewContractClient } from '@/components/investments/new-contract-client'

export default async function NewContractPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <NewContractClient userId={user.id} />
}
