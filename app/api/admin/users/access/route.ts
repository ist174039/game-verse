import { NextResponse } from 'next/server'
import { ADMIN_ROLES, canAdmin, getAdminSession } from '@/lib/server/admin-auth'
import type { InternalRole } from '@/lib/domain/governance'

export const runtime='nodejs'
export const dynamic='force-dynamic'

const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request:Request){
  const session=await getAdminSession()
  if(!session) return NextResponse.json({error:'admin_access_required'},{status:401})
  if(!canAdmin(session.role,'ADMIN_USERS')) return NextResponse.json({error:'admin_management_forbidden'},{status:403})

  let body:{userId?:unknown;role?:unknown;active?:unknown;reason?:unknown}
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}

  const userId=typeof body.userId==='string'?body.userId:''
  const role=typeof body.role==='string'?body.role as InternalRole:null
  const active=typeof body.active==='boolean'?body.active:null
  const reason=typeof body.reason==='string'?body.reason.trim():''

  if(!UUID_RE.test(userId)||!role||!ADMIN_ROLES.has(role)||active===null||reason.length<5){
    return NextResponse.json({error:'invalid_admin_access_request'},{status:400})
  }
  if(role==='super_admin'&&session.role!=='super_admin'){
    return NextResponse.json({error:'super_admin_assignment_forbidden'},{status:403})
  }

  const {data,error}=await session.serviceClient.rpc('service_set_admin_user',{
    p_user_id:userId,
    p_role:role,
    p_active:active,
    p_actor_user_id:session.user.id,
    p_reason:reason,
  })
  if(error){
    const message=error.message||'admin_access_update_failed'
    const status=message.includes('forbidden')?403:message.includes('last_super_admin_protected')?409:400
    return NextResponse.json({error:message},{status})
  }

  return NextResponse.json({success:true,admin:data})
}
