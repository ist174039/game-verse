import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readBoundedJson } from '@/lib/server/bounded-json'

export const runtime='nodejs'
const text=(value:unknown)=>typeof value==='string'?value.trim():''

export async function POST(request:Request){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user||user.is_anonymous)return NextResponse.json({error:'authentication_required'},{status:401})
  const parsed=await readBoundedJson<Record<string,unknown>>(request,16*1024)
  if(!parsed.ok)return NextResponse.json({error:parsed.reason==='too_large'?'request_too_large':'invalid_json'},{status:400})
  const body=parsed.value
  const action=text(body.action)
  try{
    if(action==='create'){
      const category=text(body.category),subject=text(body.subject),description=text(body.description)
      const clubId=text(body.clubId)||null,universeId=text(body.universeId)||null
      if(!category||category.length>40||subject.length<4||subject.length>120||description.length<10||description.length>5000)return NextResponse.json({error:'Dados do pedido incompletos ou demasiado longos.'},{status:400})
      const{data,error}=await supabase.rpc('create_support_ticket',{p_category:category,p_subject:subject,p_description:description,p_club_id:clubId,p_universe_id:universeId,p_metadata:{source:'SUPPORT_CENTER'}})
      if(error)throw error
      return NextResponse.json({ticket:data},{status:201})
    }
    if(action==='reply'){
      const ticketId=text(body.ticketId),reply=text(body.body)
      if(!ticketId||ticketId.length>64||reply.length<2||reply.length>5000)return NextResponse.json({error:'Escreve uma resposta válida antes de enviar.'},{status:400})
      const{data,error}=await supabase.rpc('reply_support_ticket',{p_ticket_id:ticketId,p_body:reply})
      if(error)throw error
      return NextResponse.json({note:data})
    }
    if(action==='reopen'){
      const ticketId=text(body.ticketId),reason=text(body.body)
      if(!ticketId||ticketId.length>64||reason.length<2||reason.length>2000)return NextResponse.json({error:'Indica um motivo válido para reabrir o pedido.'},{status:400})
      const{data,error}=await supabase.rpc('reopen_support_ticket',{p_ticket_id:ticketId,p_body:reason})
      if(error)throw error
      return NextResponse.json({ticket:data})
    }
    return NextResponse.json({error:'unsupported_support_action'},{status:400})
  }catch{
    // Do not expose database diagnostics, ticket content, or provider details.
    console.error('[support] operation_failed')
    return NextResponse.json({error:'support_operation_failed'},{status:409})
  }
}
