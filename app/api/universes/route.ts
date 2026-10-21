import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allowlistedErrorCode } from '@/lib/server/safe-error-code'

export const runtime='nodejs'

const text=(value:unknown)=>typeof value==='string'?value.trim():''
const universeErrors = [
  'universe_creation_disabled', 'insufficient_gold', 'community_universe_limit_reached',
  'universe_slug_in_use', 'universe_name_invalid', 'universe_slug_invalid',
] as const
const friendlyMessages: Record<(typeof universeErrors)[number], string> = {
  universe_creation_disabled: 'A criação de universos está temporariamente desativada pela governação da plataforma.',
  insufficient_gold: 'Gold insuficiente para criar este universo.',
  community_universe_limit_reached: 'Atingiste o limite de universos comunitários que podes gerir.',
  universe_slug_in_use: 'Este identificador de universo já está em utilização.',
  universe_name_invalid: 'O nome do universo deve ter entre 3 e 50 caracteres.',
  universe_slug_invalid: 'O identificador deve usar apenas letras minúsculas, números e hífenes.',
}

export async function POST(request:Request){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user||user.is_anonymous)return NextResponse.json({error:'authentication_required'},{status:401})
  let body:Record<string,unknown>
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const name=text(body.name),slug=text(body.slug).toLowerCase(),description=text(body.description),idempotencyKey=text(body.idempotencyKey)
  if(name.length<3||slug.length<3||idempotencyKey.length<8)return NextResponse.json({error:'invalid_universe_request'},{status:400})
  const{data,error}=await supabase.rpc('create_governed_community_universe',{p_name:name,p_slug:slug,p_description:description||null,p_idempotency_key:idempotencyKey})
  if(error){const code=allowlistedErrorCode(error,universeErrors,'universe_creation_failed');console.error('[universe-create] operation_failed');return NextResponse.json({error:friendlyMessages[code as keyof typeof friendlyMessages]??'Não foi possível criar o universo.',code},{status:409})}
  return NextResponse.json({result:data},{status:201})
}
