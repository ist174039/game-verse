import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime='nodejs'
const text=(value:unknown)=>typeof value==='string'?value.trim():''
function errorMessage(error:unknown){
  if(error instanceof Error)return error.message
  if(error&&typeof error==='object'){
    const value=error as {message?:unknown;details?:unknown;hint?:unknown}
    return [value.message,value.details,value.hint].find(item=>typeof item==='string'&&item.length>0) as string|undefined ?? 'support_operation_failed'
  }
  return 'support_operation_failed'
}

export async function POST(request:Request){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user||user.is_anonymous)return NextResponse.json({error:'authentication_required'},{status:401})
  let body:Record<string,unknown>
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const action=text(body.action)
  try{
    if(action==='create'){
      const category=text(body.category),subject=text(body.subject),description=text(body.description)
      const clubId=text(body.clubId)||null,universeId=text(body.universeId)||null
      if(!category||subject.length<4||description.length<10)return NextResponse.json({error:'Dados do pedido incompletos.'},{status:400})
      const{data,error}=await supabase.rpc('create_support_ticket',{p_category:category,p_subject:subject,p_description:description,p_club_id:clubId,p_universe_id:universeId,p_metadata:{source:'SUPPORT_CENTER'}})
      if(error)throw error
      return NextResponse.json({ticket:data},{status:201})
    }
    if(action==='reply'){
      const ticketId=text(body.ticketId),reply=text(body.body)
      if(!ticketId||reply.length<2)return NextResponse.json({error:'Escreve uma resposta antes de enviar.'},{status:400})
      const{data,error}=await supabase.rpc('reply_support_ticket',{p_ticket_id:ticketId,p_body:reply})
      if(error)throw error
      return NextResponse.json({note:data})
    }
    if(action==='reopen'){
      const ticketId=text(body.ticketId),reason=text(body.body)
      if(!ticketId||reason.length<2)return NextResponse.json({error:'Indica por que motivo queres reabrir o pedido.'},{status:400})
      const{data,error}=await supabase.rpc('reopen_support_ticket',{p_ticket_id:ticketId,p_body:reason})
      if(error)throw error
      return NextResponse.json({ticket:data})
    }
    return NextResponse.json({error:'unsupported_support_action'},{status:400})
  }catch(error){
    const code=errorMessage(error)
    console.error('[support]',error)
    return NextResponse.json({error:code},{status:409})
  }
}
