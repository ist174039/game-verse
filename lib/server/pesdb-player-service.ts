import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPesdbCatalogPage, fetchPesdbPlayerDetail, PESDB_PROVIDER, type PesdbCatalogPlayer } from '@/lib/infrastructure/providers/pesdb'

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
const message=(error:unknown)=>error instanceof Error?error.message:'unknown_error'
const STARTER_MIN_OVERALL=55
const STARTER_MAX_OVERALL=70

async function upsertPlayer(client:SupabaseClient,input:{
  externalId:string;providerVersion:string;name:string;position:string;overall:number;nationality:string|null;attributes:Record<string,unknown>;sourcePayload:Record<string,unknown>
}){
  const {error}=await client.rpc('service_upsert_provider_player',{
    p_provider:PESDB_PROVIDER,
    p_external_id:input.externalId,
    p_provider_version:input.providerVersion,
    p_name:input.name,
    p_position:input.position,
    p_overall:input.overall,
    p_nationality:input.nationality,
    p_image_url:null,
    p_attributes:input.attributes,
    p_popularity_index:null,
    p_source_payload:input.sourcePayload,
  })
  if(error)throw error
}

async function importCatalogPlayers(client:SupabaseClient,players:PesdbCatalogPlayer[],providerVersion:string,page:number){
  let imported=0,failed=0
  const failures:Array<{externalId:string;error:string}>=[]
  for(let index=0;index<players.length;index+=8){
    const chunk=players.slice(index,index+8)
    const results=await Promise.allSettled(chunk.map(player=>upsertPlayer(client,{
      externalId:player.externalId,
      providerVersion,
      name:player.name,
      position:player.position,
      overall:player.overall,
      nationality:player.nationality,
      attributes:{sourceDepth:'CATALOG',teamName:player.teamName,height:player.height,weight:player.weight,age:player.age,sourceUrl:player.sourceUrl},
      sourcePayload:{source:'PESDB',sourceDepth:'CATALOG',sourceUrl:player.sourceUrl,page,teamName:player.teamName,height:player.height,weight:player.weight,age:player.age},
    })))
    results.forEach((result,i)=>{if(result.status==='fulfilled')imported++;else{failed++;failures.push({externalId:chunk[i].externalId,error:message(result.reason)})}})
  }
  return{imported,failed,failures}
}

async function recordRun(client:SupabaseClient,input:{providerVersion:string;syncType:'CATALOG_PAGE'|'DETAIL_BATCH';pageNumber:number|null;requested:number;imported:number;failed:number;actorUserId:string;metadata:Record<string,unknown>}){
  const status=input.failed===0?'COMPLETED':input.imported>0?'PARTIAL':'FAILED'
  const {data,error}=await client.rpc('service_record_provider_sync',{
    p_provider:PESDB_PROVIDER,p_provider_version:input.providerVersion,p_sync_type:input.syncType,p_page_number:input.pageNumber,
    p_requested_count:input.requested,p_imported_count:input.imported,p_failed_count:input.failed,p_status:status,p_actor_user_id:input.actorUserId,p_metadata:input.metadata,
  })
  if(error)throw error
  return {runId:data as string,status}
}

export async function syncPesdbCatalogPages(client:SupabaseClient,input:{page:number;pages:number;actorUserId:string}){
  const pages=Math.max(1,Math.min(3,Math.trunc(input.pages)))
  const startPage=Math.max(1,Math.trunc(input.page))
  let requested=0,imported=0,failed=0,totalPlayers:number|null=null,estimatedPages:number|null=null
  let providerVersion='PESDB',lastUpdate:string|null=null,gameVersion:string|null=null
  const failures:Array<{externalId:string;error:string}>=[]

  for(let offset=0;offset<pages;offset++){
    const page=startPage+offset
    const catalog=await fetchPesdbCatalogPage(page)
    providerVersion=catalog.providerVersion;lastUpdate=catalog.lastUpdate;gameVersion=catalog.gameVersion;totalPlayers=catalog.totalPlayers;estimatedPages=catalog.estimatedPages
    requested+=catalog.players.length
    const outcome=await importCatalogPlayers(client,catalog.players,catalog.providerVersion,page)
    imported+=outcome.imported;failed+=outcome.failed;failures.push(...outcome.failures)
    if(offset<pages-1)await sleep(900)
  }

  const run=await recordRun(client,{providerVersion,syncType:'CATALOG_PAGE',pageNumber:startPage,requested,imported,failed,actorUserId:input.actorUserId,metadata:{pages,totalPlayers,estimatedPages,lastUpdate,gameVersion,failures:failures.slice(0,20)}})
  return {...run,provider:PESDB_PROVIDER,providerVersion,startPage,pages,requested,imported,failed,totalPlayers,estimatedPages,lastUpdate,gameVersion,failures}
}

export async function syncPesdbStarterPool(client:SupabaseClient,input:{actorUserId:string}){
  const overview=await fetchPesdbCatalogPage(1)
  if(!overview.estimatedPages||overview.estimatedPages<2)throw new Error('pesdb_catalog_size_unknown')

  const step=Math.max(1,Math.round(overview.estimatedPages*0.04))
  let page=Math.max(2,Math.min(overview.estimatedPages,Math.round(overview.estimatedPages*0.76)))
  const scannedPages:number[]=[]
  const eligible=new Map<string,{player:PesdbCatalogPlayer;page:number;providerVersion:string}>()
  let providerVersion=overview.providerVersion

  for(let attempt=0;attempt<3;attempt++){
    if(scannedPages.includes(page))break
    if(attempt>0)await sleep(900)
    const catalog=await fetchPesdbCatalogPage(page)
    providerVersion=catalog.providerVersion
    scannedPages.push(page)
    for(const player of catalog.players){
      if(player.overall>=STARTER_MIN_OVERALL&&player.overall<=STARTER_MAX_OVERALL)eligible.set(player.externalId,{player,page,providerVersion:catalog.providerVersion})
    }
    if(eligible.size>=36)break
    const ratings=catalog.players.map(player=>player.overall)
    const minimum=Math.min(...ratings),maximum=Math.max(...ratings)
    if(minimum>STARTER_MAX_OVERALL)page=Math.min(overview.estimatedPages,page+step)
    else if(maximum<STARTER_MIN_OVERALL)page=Math.max(2,page-step)
    else page=Math.min(overview.estimatedPages,page+1)
  }

  if(eligible.size===0)throw new Error('pesdb_starter_pool_not_found')
  let imported=0,failed=0
  const failures:Array<{externalId:string;error:string}>=[]
  const grouped=new Map<number,Array<{player:PesdbCatalogPlayer;providerVersion:string}>>()
  for(const item of eligible.values())grouped.set(item.page,[...(grouped.get(item.page)??[]),{player:item.player,providerVersion:item.providerVersion}])
  for(const [sourcePage,items] of grouped){
    const outcome=await importCatalogPlayers(client,items.map(item=>item.player),items[0]?.providerVersion??providerVersion,sourcePage)
    imported+=outcome.imported;failed+=outcome.failed;failures.push(...outcome.failures)
  }

  const run=await recordRun(client,{providerVersion,syncType:'CATALOG_PAGE',pageNumber:scannedPages[0]??null,requested:eligible.size,imported,failed,actorUserId:input.actorUserId,metadata:{starterPool:true,starterOverallRange:[STARTER_MIN_OVERALL,STARTER_MAX_OVERALL],scannedPages,estimatedPages:overview.estimatedPages,totalPlayers:overview.totalPlayers,lastUpdate:overview.lastUpdate,gameVersion:overview.gameVersion,failures:failures.slice(0,20)}})
  return {...run,provider:PESDB_PROVIDER,providerVersion,starterOverallRange:[STARTER_MIN_OVERALL,STARTER_MAX_OVERALL],scannedPages,eligibleFound:eligible.size,imported,failed,totalPlayers:overview.totalPlayers,estimatedPages:overview.estimatedPages,failures}
}

export async function syncPesdbDetails(client:SupabaseClient,input:{externalIds:string[];actorUserId:string}){
  const ids=[...new Set(input.externalIds.map(id=>id.trim()).filter(id=>/^\d+$/.test(id)))].slice(0,6)
  if(ids.length===0)throw new Error('pesdb_detail_ids_required')
  let imported=0,failed=0,providerVersion='PESDB'
  const failures:Array<{externalId:string;error:string}>=[]
  for(let index=0;index<ids.length;index++){
    const externalId=ids[index]
    try{
      const player=await fetchPesdbPlayerDetail(externalId)
      providerVersion=player.providerVersion
      await upsertPlayer(client,{
        externalId:player.externalId,providerVersion:player.providerVersion,name:player.name,position:player.position,overall:player.overall,nationality:player.nationality,
        attributes:{sourceDepth:'DETAIL',teamName:player.teamName,league:player.league,region:player.region,height:player.height,weight:player.weight,age:player.age,foot:player.foot,maximumLevel:player.maximumLevel,rating:player.rating,playingStyle:player.playingStyle,playerSkills:player.playerSkills,aiPlayingStyles:player.aiPlayingStyles,abilities:player.abilities,sourceUrl:player.sourceUrl},
        sourcePayload:{source:'PESDB',sourceDepth:'DETAIL',sourceUrl:player.sourceUrl,teamName:player.teamName,league:player.league,region:player.region,height:player.height,weight:player.weight,age:player.age,foot:player.foot,maximumLevel:player.maximumLevel,rating:player.rating,playingStyle:player.playingStyle,playerSkills:player.playerSkills,aiPlayingStyles:player.aiPlayingStyles,abilities:player.abilities},
      })
      imported++
    }catch(error){failed++;failures.push({externalId,error:message(error)})}
    if(index<ids.length-1)await sleep(450)
  }
  const run=await recordRun(client,{providerVersion,syncType:'DETAIL_BATCH',pageNumber:null,requested:ids.length,imported,failed,actorUserId:input.actorUserId,metadata:{externalIds:ids,failures}})
  return {...run,provider:PESDB_PROVIDER,providerVersion,requested:ids.length,imported,failed,failures}
}

export async function materializePesdbPlayers(client:SupabaseClient,input:{universeId:string;limit:number;rebootstrap:boolean;actorUserId:string}){
  const limit=Math.max(1,Math.min(5000,Math.trunc(input.limit)))
  const {data,error}=await client.rpc('service_materialize_provider_players',{
    p_universe_id:input.universeId,p_provider:PESDB_PROVIDER,p_limit:limit,p_rebootstrap:input.rebootstrap,p_actor_user_id:input.actorUserId,
  })
  if(error)throw error
  return data as Record<string,unknown>
}
