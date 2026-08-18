import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseInternalJobsRepository } from '@/lib/infrastructure/repositories/supabase/internal-jobs-repository'

export const runtime='nodejs'
export const dynamic='force-dynamic'

function secureEqual(a:string,b:string){
  const left=Buffer.from(a),right=Buffer.from(b)
  return left.length===right.length&&timingSafeEqual(left,right)
}

function authorized(request:NextRequest):boolean{
  const authorization=request.headers.get('authorization')
  if(!authorization?.startsWith('Bearer '))return false
  const supplied=authorization.slice(7)
  const accepted=[process.env.CRON_SECRET,process.env.INTERNAL_JOBS_SECRET].filter((value):value is string=>Boolean(value&&value.length>=16))
  return accepted.some(secret=>secureEqual(supplied,secret))
}

async function runMaintenance(request:NextRequest){
  if(!authorized(request))return NextResponse.json({error:'unauthorized'},{status:401,headers:{'cache-control':'no-store'}})
  const startedAt=new Date()
  try{
    const client=createAdminClient()
    const jobs=new SupabaseInternalJobsRepository(client)
    const hour=startedAt.toISOString().slice(0,13)
    const result=await jobs.runMaintenance({jobKey:`maintenance:${hour}`})
    console.info('[internal-maintenance]',{startedAt:startedAt.toISOString(),finishedAt:new Date().toISOString(),...result})
    return NextResponse.json({ok:true,startedAt:startedAt.toISOString(),...result},{headers:{'cache-control':'no-store'}})
  }catch(error){
    console.error('[internal-maintenance]',error)
    return NextResponse.json({error:'maintenance_failed'},{status:500,headers:{'cache-control':'no-store'}})
  }
}

export async function GET(request:NextRequest){return runMaintenance(request)}
export async function POST(request:NextRequest){return runMaintenance(request)}
