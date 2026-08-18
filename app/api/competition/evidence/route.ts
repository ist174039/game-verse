import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime='nodejs'

export async function POST(request:Request){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user||user.is_anonymous)return NextResponse.json({error:'authentication_required'},{status:401})

  let body:{matchId?:unknown;filePath?:unknown;metadata?:unknown}
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  if(typeof body.matchId!=='string'||typeof body.filePath!=='string')return NextResponse.json({error:'invalid_request'},{status:400})
  if(!body.filePath.startsWith(`${body.matchId}/${user.id}-`))return NextResponse.json({error:'invalid_evidence_path'},{status:403})
  const metadata=body.metadata&&typeof body.metadata==='object'&&!Array.isArray(body.metadata)?body.metadata:{}

  const{data,error}=await supabase.rpc('register_match_evidence',{p_match_id:body.matchId,p_file_path:body.filePath,p_metadata:metadata})
  if(error)return NextResponse.json({error:error.message||'evidence_registration_failed'},{status:409})
  return NextResponse.json({evidence:data})
}
