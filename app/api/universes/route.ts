import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime='nodejs'

const text=(value:unknown)=>typeof value==='string'?value.trim():''
function message(error:unknown){
  if(error instanceof Error)return error.message
  if(error&&typeof error==='object'){
    const value=error as {message?:unknown;details?:unknown;hint?:unknown;code?:unknown}
    return [value.message,value.details,value.hint].find(item=>typeof item==='string'&&item.length>0) as string|undefined ?? 'universe_creation_failed'
  }
  return 'universe_creation_failed'
}
function friendly(code:string){
  if(code.includes('universe_creation_disabled'))return 'A criação de universos está temporariamente desativada pela governação da plataforma.'
  if(code.includes('insufficient_gold'))return 'Gold insuficiente para criar este universo.'
  if(code.includes('community_universe_limit_reached'))return 'Atingiste o limite de universos comunitários que podes gerir.'
  if(code.includes('universe_slug_in_use'))return 'Este identificador de universo já está em utilização.'
  if(code.includes('universe_name_invalid'))return 'O nome do universo deve ter entre 3 e 50 caracteres.'
  if(code.includes('universe_slug_invalid'))return 'O identificador deve usar apenas letras minúsculas, números e hífenes.'
  return code
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
  if(error){const code=message(error);console.error('[universe-create]',{code:error.code,message:error.message,details:error.details,hint:error.hint});return NextResponse.json({error:friendly(code),code},{status:409})}
  return NextResponse.json({result:data},{status:201})
}
