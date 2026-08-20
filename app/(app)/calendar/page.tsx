import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { resolveOwnedUniverseContext, onboardingHref } from '@/lib/server/active-universe'
import { DashboardUniverseSwitcher } from '@/components/dashboard/dashboard-universe-switcher'
import { CalendarClient } from '@/components/calendar/calendar-client'

export const dynamic='force-dynamic'

export default async function CalendarPage({searchParams}:{searchParams:Promise<{universe?:string}>}){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||user.is_anonymous)redirect('/auth/login')
  const services=createApplicationServices(supabase);const requestedUniverseId=(await searchParams).universe
  const directory=await services.reads.universeDirectory.load(user.id)
  const{selected,onboardingUniverseId}=resolveOwnedUniverseContext(directory.entries,requestedUniverseId)
  if(onboardingUniverseId)redirect(onboardingHref(onboardingUniverseId))
  if(!selected?.club)redirect('/onboarding')
  const calendar=await services.reads.calendar.load(user.id,selected.universe.id)
  if(!calendar)redirect(onboardingHref(selected.universe.id))
  return <div className="space-y-6"><DashboardUniverseSwitcher entries={directory.entries} activeUniverseId={calendar.universe.id}/><CalendarClient calendar={calendar}/></div>
}
