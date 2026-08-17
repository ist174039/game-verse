import { createClient } from '@/lib/supabase/server'
import { hasSupabasePublicConfig } from '@/lib/supabase/config'
import { redirect } from 'next/navigation'
import { HomeContent } from '@/components/home/home-content'

export default async function HomePage() {
  if (hasSupabasePublicConfig()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <HomeContent />
    </div>
  )
}
