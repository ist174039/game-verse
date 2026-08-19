import { NextResponse } from 'next/server'
import type { MatchDisputeDecision } from '@/lib/application/admin-contracts'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'

export const runtime='nodejs'

export async function POST(request:Request){
  const session=await getAdminSession()
  if(!session)return NextResponse.json({error:'admin_auth_required'},{status:401})
  if(!canAdmin(session.role,'COMPETITION'))return NextResponse.json({error:'admin_permission_denied'},{status:403})

  let body:{
    action?:unknown
    competitionId?:unknown
    startsAt?:unknown
    roundIntervalDays?:unknown
    disputeId?:unknown
    decision?:unknown
    resolution?:unknown
    idempotencyKey?:unknown
    homeScore?:unknown
    awayScore?:unknown
  }
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}

  const action=typeof body.action==='string'?body.action:''
  const services=createAdminApplicationServices(session.userClient,session.serviceClient)

  try{
    if(action==='resolve-dispute'){
      const disputeId=typeof body.disputeId==='string'?body.disputeId:''
      const decision=typeof body.decision==='string'?body.decision.toUpperCase():''
      const resolution=typeof body.resolution==='string'?body.resolution.trim():''
      const idempotencyKey=typeof body.idempotencyKey==='string'?body.idempotencyKey.trim():''
      if(!disputeId||!['UPHOLD','CORRECT_SCORE','REPLAY'].includes(decision)||resolution.length<5||idempotencyKey.length<8){
        return NextResponse.json({error:'invalid_dispute_resolution'},{status:400})
      }
      const homeScore=typeof body.homeScore==='number'&&Number.isInteger(body.homeScore)?body.homeScore:null
      const awayScore=typeof body.awayScore==='number'&&Number.isInteger(body.awayScore)?body.awayScore:null
      if(decision==='CORRECT_SCORE'&&(homeScore===null||awayScore===null||homeScore<0||awayScore<0)){
        return NextResponse.json({error:'corrected_score_required'},{status:400})
      }
      const result=await services.competitionAdmin.resolveDispute({
        disputeId,
        decision:decision as MatchDisputeDecision,
        resolution,
        actorUserId:session.user.id,
        idempotencyKey,
        homeScore,
        awayScore,
      })
      return NextResponse.json({result})
    }

    const competitionId=typeof body.competitionId==='string'?body.competitionId:''
    if(!competitionId||!['activate','progress'].includes(action)){
      return NextResponse.json({error:'invalid_competition_operation'},{status:400})
    }

    const result=action==='activate'
      ? await services.competitionAdmin.activate({
          competitionId,
          actorUserId:session.user.id,
          startsAt:typeof body.startsAt==='string'?body.startsAt:null,
          roundIntervalDays:typeof body.roundIntervalDays==='number'?body.roundIntervalDays:7,
        })
      : await services.competitionAdmin.progress({competitionId,actorUserId:session.user.id})
    return NextResponse.json({result})
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'competition_operation_failed'},{status:409})
  }
}
