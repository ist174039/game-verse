import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DisciplinaryClient } from '@/components/team/disciplinary-client'

export default async function DisciplinaryPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return <DisciplinaryClient />
}
