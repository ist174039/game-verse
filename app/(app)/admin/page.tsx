import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPanelClient } from '@/components/admin/admin-panel-client'

export default async function AdminPanelPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Optional: check if user has admin/mod role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Uncomment to restrict access:
  // if (!profile || (profile.role !== 'admin' && profile.role !== 'moderador')) {
  //   redirect('/dashboard')
  // }

  return (
    <div className="mx-auto max-w-6xl py-8 px-4">
      <AdminPanelClient />
    </div>
  )
}
