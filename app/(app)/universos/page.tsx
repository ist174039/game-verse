import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { redirect } from 'next/navigation'
import { UniversosClient } from '@/components/universos/universos-client'

export default async function UniversosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const services = createApplicationServices(supabase)
  const directory = await services.reads.universeDirectory.load(user.id)

  return <UniversosClient directory={directory} />
}
