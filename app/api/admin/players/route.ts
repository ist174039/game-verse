import { NextResponse } from 'next/server'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'
import { materializePesdbPlayers, syncPesdbCatalogPages, syncPesdbDetails, syncPesdbStarterPool } from '@/lib/server/pesdb-player-service'

export const runtime='nodejs'
export const dynamic='force-dynamic'
const int=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?Math.trunc(value):typeof value==='string'&&/^\d+$/.test(value)?Number.parseInt(value,10):fallback

export async function POST(request:Request){
  const session=await getAdminSession()
  if(!session)return NextResponse.json({error:'admin_auth_required'},{status:401})
  if(!canAdmin(session.role,'PLAYERS'))return NextResponse.json({error:'admin_permission_denied'},{status:403})
  let body:Record<string,unknown>
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const action=typeof body.action==='string'?body.action:''
  try{
    if(action==='syncCatalog'){const page=Math.max(1,int(body.page,1)),pages=Math.max(1,Math.min(3,int(body.pages,1)));const result=await syncPesdbCatalogPages(session.serviceClient,{page,pages,actorUserId:session.user.id});return NextResponse.json({result})}
    if(action==='syncStarterPool'){const result=await syncPesdbStarterPool(session.serviceClient,{actorUserId:session.user.id});return NextResponse.json({result})}
    if(action==='syncDetails'){const externalIds=Array.isArray(body.externalIds)?body.externalIds.filter((id):id is string=>typeof id==='string'):typeof body.externalIds==='string'?body.externalIds.split(/[\s,;]+/):[];const result=await syncPesdbDetails(session.serviceClient,{externalIds,actorUserId:session.user.id});return NextResponse.json({result})}
    if(action==='materialize'){const universeId=typeof body.universeId==='string'?body.universeId:'';if(!universeId)return NextResponse.json({error:'universe_required'},{status:400});const result=await materializePesdbPlayers(session.serviceClient,{universeId,limit:Math.max(1,Math.min(5000,int(body.limit,500))),rebootstrap:body.rebootstrap!==false,actorUserId:session.user.id});return NextResponse.json({result})}
    return NextResponse.json({error:'unsupported_player_provider_action'},{status:400})
  }catch(error){
    const code=error instanceof Error?error.message:'player_provider_operation_failed'
    const providerUnavailable=/pesdb_http_(429|503)|pesdb_unavailable/.test(code)
    if(providerUnavailable){console.warn('[admin-player-provider] provider temporarily unavailable',code);return NextResponse.json({error:'O PESDB está temporariamente a limitar pedidos. Aguarda alguns instantes e retoma o ciclo; as páginas já importadas permanecem guardadas.',code:'pesdb_temporarily_unavailable',retryable:true},{status:503})}
    console.error('[admin-player-provider]',error)
    return NextResponse.json({error:code},{status:409})
  }
}
