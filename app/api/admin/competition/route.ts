import { NextResponse } from 'next/server'
import type { MatchDisputeDecision } from '@/lib/application/admin-contracts'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'

export const runtime='nodejs'

const knownCompetitionErrors=[
  'competition_requires_two_participants',
  'competition_schedule_already_exists',
  'competition_not_activatable',
  'competition_type_not_schedulable',
  'competition_not_found',
  'competition_already_completed',
  'invalid_round_interval',
] as const

function normalizeCompetitionError(error:unknown){
  const record=error&&typeof error==='object'?error as Record<string,unknown>:{}
  const message=error instanceof Error?error.message:typeof record.message==='string'?record.message:''
  const code=typeof record.code==='string'?record.code:''
  const details=typeof record.details==='string'?record.details:''
  const hint=typeof record.hint==='string'?record.hint:''
  const diagnostic=`${message} ${details} ${hint}`
  const missingRuntime=code==='PGRST202'||(/could not find/i.test(diagnostic)&&/service_(activate|progress)_competition/i.test(diagnostic))
  const clientError=missingRuntime
    ?'competition_runtime_not_migrated'
    :knownCompetitionErrors.find(key=>diagnostic.includes(key))??'competition_operation_failed'
  return{clientError,message,code,details,hint}
}

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
  const competitionId=typeof body.competitionId==='string'?body.competitionId:''
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

    if(!competitionId||!['activate','progress'].includes(action)){
      return NextResponse.json({error:'invalid_competition_operation'},{status:400})
    }

    if(action==='activate'){
      const{count,error:registrationError}=await session.serviceClient
        .from('competition_registration')
        .select('competition_id',{head:true,count:'exact'})
        .eq('competition_id',competitionId)
        .in('state',['REGISTERED','APPROVED'])
      if(registrationError)throw registrationError
      if((count??0)<2)return NextResponse.json({error:'competition_requires_two_participants'},{status:409})
    }

    const result=action==='activate'
      ?await services.competitionAdmin.activate({
          competitionId,
          actorUserId:session.user.id,
          startsAt:typeof body.startsAt==='string'?body.startsAt:null,
          roundIntervalDays:typeof body.roundIntervalDays==='number'?body.roundIntervalDays:7,
        })
      :await services.competitionAdmin.progress({competitionId,actorUserId:session.user.id})
    return NextResponse.json({result})
  }catch(error){
    const normalized=normalizeCompetitionError(error)
    console.error('[admin-competition]',{
      action,
      competitionId:competitionId||null,
      message:normalized.message,
      code:normalized.code,
      details:normalized.details,
      hint:normalized.hint,
    })
    return NextResponse.json({error:normalized.clientError},{status:409})
  }
}
