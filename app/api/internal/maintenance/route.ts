import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseInternalJobsRepository } from '@/lib/infrastructure/repositories/supabase/internal-jobs-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest): boolean {
  const secret=process.env.INTERNAL_JOBS_SECRET
  if (!secret) return false
  const auth=request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({error:'unauthorized'},{status:401})
  try {
    const client=createAdminClient()
    const jobs=new SupabaseInternalJobsRepository(client)
    const now=new Date()
    const hour=now.toISOString().slice(0,13)
    const result=await jobs.runMaintenance({jobKey:`maintenance:${hour}`})
    return NextResponse.json({ok:true,...result})
  } catch (error) {
    console.error('[internal-maintenance]',error)
    return NextResponse.json({error:'maintenance_failed'},{status:500})
  }
}
