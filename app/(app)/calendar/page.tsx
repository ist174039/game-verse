import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { DashboardUniverseSwitcher } from '@/components/dashboard/dashboard-universe-switcher'
import { CalendarClient } from '@/components/calendar/calendar-client'

export const dynamic='force-dynamic'

export default async function CalendarPage({searchParams}:{searchParams:Promise<{universe?:string}>}){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user||user.is_anonymous)redirect('/auth/login')

  const services=createApplicationServices(supabase)
  const requestedUniverseId=(await searchParams).universe
  const directory=await services.reads.universeDirectory.load(user.id)
  const selected=(requestedUniverseId
    ?directory.entries.find(entry=>entry.universe.id===requestedUniverseId&&entry.club)
    :null)??directory.entries.find(entry=>entry.club)
  if(!selected?.club)redirect('/onboarding')

  const calendar=await services.reads.calendar.load(user.id,selected.universe.id)
  if(!calendar)redirect('/onboarding')

  return <div className="space-y-6">
    <DashboardUniverseSwitcher entries={directory.entries} activeUniverseId={calendar.universe.id}/>
    <CalendarClient calendar={calendar}/>
  </div>
}
