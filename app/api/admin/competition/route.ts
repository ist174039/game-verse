import { NextResponse } from 'next/server'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'

export const runtime='nodejs'

export async function POST(request:Request){
  const session=await getAdminSession()
  if(!session)return NextResponse.json({error:'admin_auth_required'},{status:401})
  if(!canAdmin(session.role,'COMPETITION'))return NextResponse.json({error:'admin_permission_denied'},{status:403})
  let body:{action?:unknown;competitionId?:unknown;startsAt?:unknown;roundIntervalDays?:unknown}
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const action=typeof body.action==='string'?body.action:''
  const competitionId=typeof body.competitionId==='string'?body.competitionId:''
  if(!competitionId||!['activate','progress'].includes(action))return NextResponse.json({error:'invalid_competition_operation'},{status:400})
  try{
    const services=createAdminApplicationServices(session.userClient,session.serviceClient)
    const result=action==='activate'
      ? await services.competitionAdmin.activate({competitionId,actorUserId:session.user.id,startsAt:typeof body.startsAt==='string'?body.startsAt:null,roundIntervalDays:typeof body.roundIntervalDays==='number'?body.roundIntervalDays:7})
      : await services.competitionAdmin.progress({competitionId,actorUserId:session.user.id})
    return NextResponse.json({result})
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'competition_operation_failed'},{status:409})}
}
