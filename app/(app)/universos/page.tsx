import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { redirect } from 'next/navigation'
import { UniversosClient } from '@/components/universos/universos-client'

export default async function UniversosPage(){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login')
  const services=createApplicationServices(supabase)
  const[directory,policyQ]=await Promise.all([services.reads.universeDirectory.load(user.id),supabase.rpc('get_community_universe_creation_policy')])
  const raw=policyQ.error?null:policyQ.data as Record<string,unknown>|null
  const creationPolicy={enabled:Boolean(raw?.enabled),goldCost:Number(raw?.gold_cost??0),maxOwned:Number(raw?.max_owned??0),ownedCount:Number(raw?.owned_count??0),goldBalance:Number(raw?.gold_balance??0)}
  return <UniversosClient directory={directory} creationPolicy={creationPolicy}/>
}
