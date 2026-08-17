import { createClient } from '@/lib/supabase/server'
import { BackofficeClient } from '@/components/backoffice/backoffice-client'

export default async function BackofficePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="mx-auto max-w-6xl py-8 px-4">
      <BackofficeClient />
    </div>
  )
}
