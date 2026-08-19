import { NextResponse } from 'next/server'
import { getAdminIdentity, hasVerifiedAdminMfa } from '@/lib/server/admin-auth'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function GET(){
  const identity=await getAdminIdentity()
  if(!identity) return NextResponse.json({error:'admin_access_required'},{status:403})

  return NextResponse.json({
    userId:identity.user.id,
    email:identity.user.email??null,
    role:identity.role,
    active:true,
    mfa:{
      required:true,
      verified:hasVerifiedAdminMfa(identity),
      currentLevel:identity.currentLevel,
      nextLevel:identity.nextLevel,
    },
  })
}
