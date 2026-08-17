import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClubHeader } from '@/components/club/club-header'
import { ClubStats } from '@/components/club/club-stats'
import { InfrastructureCards } from '@/components/club/infrastructure-cards'

export default async function ClubPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const [clubResult, infraResult, walletResult] = await Promise.all([
    supabase.from('club').select('*').eq('user_id', user.id).single(),
    supabase.from('club_infrastructure').select('*'),
    supabase.from('wallet').select('*').eq('user_id', user.id).single(),
  ])

  const club = clubResult.data
  const wallet = walletResult.data
  
  // Filter infrastructure by club_id after fetching
  const infrastructure = club 
    ? (infraResult.data || []).filter(i => i.club_id === club.id)
    : []

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading club data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ClubHeader club={club} />
      <ClubStats club={club} />
      <InfrastructureCards 
        infrastructure={infrastructure} 
        clubId={club.id}
        balance={wallet?.balance || 0}
      />
    </div>
  )
}
