import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime='nodejs'
export const dynamic='force-dynamic'

function safeSecretMatch(received:string,expected:string){
  const left=Buffer.from(received)
  const right=Buffer.from(expected)
  return left.length===right.length && timingSafeEqual(left,right)
}

function bearer(request:Request){
  const header=request.headers.get('authorization')??''
  return header.startsWith('Bearer ')?header.slice(7):''
}

export async function POST(request:Request){
  const startedAt=Date.now()
  const requestId=request.headers.get('x-vercel-id')
  const log=(level:'info'|'warn'|'error',event:string,extra:Record<string,unknown>={})=>{
    const entry=JSON.stringify({level,event,route:'/api/internal/admin/bootstrap',requestId,durationMs:Date.now()-startedAt,...extra})
    if(level==='error') console.error(entry)
    else if(level==='warn') console.warn(entry)
    else console.log(entry)
  }

  const secret=(process.env.ADMIN_BOOTSTRAP_SECRET??'').trim()
  if(secret.length<16){
    log('error','admin_bootstrap_misconfigured',{variable:'ADMIN_BOOTSTRAP_SECRET'})
    return NextResponse.json({error:'admin_bootstrap_secret_not_configured'},{status:503,headers:{'Cache-Control':'no-store'}})
  }
  if(!safeSecretMatch(bearer(request),secret)){
    log('warn','admin_bootstrap_rejected',{reason:'unauthorized'})
    return NextResponse.json({error:'unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}})
  }

  const email=(process.env.ADMIN_BOOTSTRAP_EMAIL??'').trim().toLowerCase()
  const password=process.env.ADMIN_BOOTSTRAP_PASSWORD??''
  if(!email || !email.includes('@')){
    log('error','admin_bootstrap_misconfigured',{variable:'ADMIN_BOOTSTRAP_EMAIL'})
    return NextResponse.json({error:'admin_bootstrap_email_not_configured'},{status:503,headers:{'Cache-Control':'no-store'}})
  }

  const serviceClient=createAdminClient()
  let createdAuthUserId:string|null=null

  async function promote(){
    return serviceClient.rpc('service_bootstrap_admin_by_email',{
      p_email:email,
      p_reason:'Initial platform administrator bootstrap',
    })
  }

  let promoted=await promote()

  if(promoted.error?.message?.includes('auth_user_not_found')){
    if(password.length<12){
      log('warn','admin_bootstrap_auth_user_missing',{passwordConfigured:false})
      return NextResponse.json({
        error:'admin_auth_user_not_found',
        detail:'Create the Auth account first or configure ADMIN_BOOTSTRAP_PASSWORD with at least 12 characters.',
      },{status:409,headers:{'Cache-Control':'no-store'}})
    }

    const created=await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm:true,
      app_metadata:{role:'super_admin'},
      user_metadata:{account_type:'platform_admin'},
    })
    if(created.error || !created.data.user){
      log('error','admin_bootstrap_auth_user_creation_failed',{message:created.error?.message??null})
      return NextResponse.json({error:created.error?.message||'admin_auth_user_creation_failed'},{status:409,headers:{'Cache-Control':'no-store'}})
    }
    createdAuthUserId=created.data.user.id
    promoted=await promote()
  }

  if(promoted.error){
    if(createdAuthUserId) await serviceClient.auth.admin.deleteUser(createdAuthUserId).catch(()=>undefined)
    const message=promoted.error.message||'admin_bootstrap_failed'
    const status=message.includes('admin_bootstrap_closed')?409:message.includes('function')||promoted.error.code==='PGRST202'?503:400
    log('error','admin_bootstrap_promotion_failed',{code:promoted.error.code,status,message})
    return NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}})
  }

  const admin=promoted.data as {user_id?:string;role?:string;active?:boolean}|null
  log('info','admin_bootstrap_completed',{createdAuthUser:Boolean(createdAuthUserId),role:admin?.role??'super_admin'})
  return NextResponse.json({
    success:true,
    createdAuthUser:Boolean(createdAuthUserId),
    admin:{userId:admin?.user_id??createdAuthUserId,email,role:admin?.role??'super_admin',active:admin?.active??true},
    bootstrapClosedForOtherUsers:true,
  },{headers:{'Cache-Control':'no-store'}})
}
