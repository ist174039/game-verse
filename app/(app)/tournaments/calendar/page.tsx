import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreatorCalendarClient } from '@/components/tournaments/creator-calendar-client'

export default async function CreatorCalendarPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return <CreatorCalendarClient />
}
