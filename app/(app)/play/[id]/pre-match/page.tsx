import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PreMatchClient } from '@/components/play/pre-match-client'

export default async function PreMatchPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // In a real app, fetch match data from DB here
  // const match = await getMatchById(matchId)
  // if (!match) notFound()

  return <PreMatchClient />
}
