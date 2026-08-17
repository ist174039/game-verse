import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from '@/components/onboarding/onboarding-client'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  return <OnboardingClient userId={user.id} />
}
