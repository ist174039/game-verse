import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/server/admin-auth'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function GET(){
  const session=await getAdminSession()
  if(!session) return NextResponse.json({error:'admin_access_required'},{status:403})
  return NextResponse.json({userId:session.user.id,email:session.user.email??null,role:session.role,active:true})
}
