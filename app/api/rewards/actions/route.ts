import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'

export const runtime='nodejs'
const text=(v:unknown)=>typeof v==='string'?v.trim():''

export async function POST(request:Request){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||user.is_anonymous)return NextResponse.json({error:'authentication_required'},{status:401})
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const action=text(body.action);const services=createApplicationServices(supabase)
  try{
    if(action==='daily'){const claim=await services.retention.claimDailyReward();return NextResponse.json({claim})}
    if(action==='mission'){const userMissionId=text(body.userMissionId),key=text(body.idempotencyKey);if(!userMissionId||key.length<3)throw new Error('invalid_mission_claim');const mission=await services.retention.claimMission(userMissionId,key);return NextResponse.json({mission})}
    if(action==='buy'){const itemId=text(body.itemId),key=text(body.idempotencyKey);if(!itemId||key.length<3)throw new Error('invalid_bronze_purchase');const purchase=await services.retention.buyBronzeItem(itemId,key);return NextResponse.json({purchase})}
    return NextResponse.json({error:'unsupported_reward_action'},{status:400})
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'reward_operation_failed'},{status:409})}
}
