import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompetitionConfigClient } from '@/components/tournaments/competition-config-client'

export default async function CompetitionConfigPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return <CompetitionConfigClient />
}
