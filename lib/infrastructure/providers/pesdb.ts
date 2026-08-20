import 'server-only'

export const PESDB_PROVIDER = 'PESDB_EFOOTBALL'
export const PESDB_BASE_URL = 'https://pesdb.net/efootball/'

const ABILITY_LABELS = [
  'Offensive Awareness','Ball Control','Dribbling','Tight Possession','Low Pass','Lofted Pass','Finishing','Heading','Set Piece Taking','Curl',
  'Defensive Awareness','Tackling','Aggression','Defensive Engagement','GK Awareness','GK Catching','GK Parrying','GK Reflexes','GK Reach',
  'Speed','Acceleration','Kicking Power','Jumping','Physical Contact','Balance','Stamina',
] as const
const CATALOG_TTL_MS=10*60_000
const DETAIL_TTL_MS=30*60_000
const STALE_TTL_MS=24*60*60_000
const MAX_CACHE_ENTRIES=200

type HtmlCacheEntry={html:string;expiresAt:number;staleUntil:number;storedAt:number}
const htmlCache=new Map<string,HtmlCacheEntry>()
const inFlight=new Map<string,Promise<string>>()
let rateLimitedUntil=0
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))

export interface PesdbCatalogPlayer {externalId:string;name:string;position:string;overall:number;nationality:string|null;teamName:string|null;height:number|null;weight:number|null;age:number|null;sourceUrl:string}
export interface PesdbCatalogPage {page:number;totalPlayers:number|null;estimatedPages:number|null;providerVersion:string;gameVersion:string|null;siteVersion:string|null;lastUpdate:string|null;players:PesdbCatalogPlayer[]}
export interface PesdbPlayerDetail extends PesdbCatalogPlayer {league:string|null;region:string|null;foot:string|null;maximumLevel:number|null;rating:string|null;playingStyle:string|null;playerSkills:string[];aiPlayingStyles:string[];abilities:Record<string,number>;providerVersion:string}

const decodeHtml=(value:string)=>value.replace(/&#x([0-9a-f]+);/gi,(_,hex:string)=>String.fromCodePoint(Number.parseInt(hex,16))).replace(/&#(\d+);/g,(_,decimal:string)=>String.fromCodePoint(Number.parseInt(decimal,10))).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
const cleanCell=(html:string)=>decodeHtml(html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim()
function documentLines(html:string){return decodeHtml(html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:div|tr|td|p|li|h[1-6]|table|section)>/gi,'\n').replace(/<[^>]+>/g,' ')).split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean)}
function metadata(html:string){const text=cleanCell(html);const siteVersion=text.match(/Version\s+(v[\d.]+)\s+Changes/i)?.[1]??null;const gameVersion=text.match(/Players have been exported from the game\s+(eFootball\s+\d{4})/i)?.[1]??null;const lastUpdate=text.match(/Last update:\s*([0-9/.-]+)/i)?.[1]??null;return{siteVersion,gameVersion,lastUpdate,providerVersion:[gameVersion,siteVersion,lastUpdate].filter(Boolean).join(' | ')||'PESDB'}}
function numberOrNull(value:string|null|undefined){if(!value)return null;const parsed=Number.parseInt(value.replace(/[^0-9-]/g,''),10);return Number.isFinite(parsed)?parsed:null}

function cacheSet(url:string,html:string,ttlMs:number){const now=Date.now();htmlCache.set(url,{html,expiresAt:now+ttlMs,staleUntil:now+STALE_TTL_MS,storedAt:now});if(htmlCache.size>MAX_CACHE_ENTRIES){const oldest=[...htmlCache.entries()].sort((a,b)=>a[1].storedAt-b[1].storedAt).slice(0,htmlCache.size-MAX_CACHE_ENTRIES);for(const[key]of oldest)htmlCache.delete(key)}}
function retryAfterMs(response:Response,attempt:number){const raw=response.headers.get('retry-after');if(raw){const seconds=Number(raw);if(Number.isFinite(seconds)&&seconds>=0)return Math.min(30_000,seconds*1000);const date=Date.parse(raw);if(Number.isFinite(date))return Math.min(30_000,Math.max(0,date-Date.now()))}return Math.min(8_000,1200*(2**attempt))}

async function fetchHtml(url:string,ttlMs:number){
  const now=Date.now();const cached=htmlCache.get(url)
  if(cached&&cached.expiresAt>now)return cached.html
  if(rateLimitedUntil>now&&cached&&cached.staleUntil>now)return cached.html
  const existing=inFlight.get(url);if(existing)return existing

  const request=(async()=>{
    let lastStatus:number|null=null
    for(let attempt=0;attempt<3;attempt++){
      if(rateLimitedUntil>Date.now())await sleep(Math.min(5_000,rateLimitedUntil-Date.now()))
      const response=await fetch(url,{cache:'no-store',headers:{accept:'text/html,application/xhtml+xml','accept-language':'en-US,en;q=0.9','user-agent':'ClanDasSombras/1.0 (admin initiated PESDB provider sync)'},signal:AbortSignal.timeout(20_000)})
      lastStatus=response.status
      if(response.ok){const contentType=response.headers.get('content-type')??'';if(!contentType.includes('text/html'))throw new Error('pesdb_unexpected_content_type');const html=await response.text();cacheSet(url,html,ttlMs);rateLimitedUntil=0;return html}
      if(response.status===429||response.status===503){const wait=retryAfterMs(response,attempt);rateLimitedUntil=Math.max(rateLimitedUntil,Date.now()+wait);if(attempt<2){await sleep(wait);continue}if(cached&&cached.staleUntil>Date.now())return cached.html}
      throw new Error(`pesdb_http_${response.status}`)
    }
    if(cached&&cached.staleUntil>Date.now())return cached.html
    throw new Error(`pesdb_http_${lastStatus??'unavailable'}`)
  })().finally(()=>inFlight.delete(url))
  inFlight.set(url,request)
  return request
}

export async function fetchPesdbCatalogPage(page=1):Promise<PesdbCatalogPage>{if(!Number.isInteger(page)||page<1)throw new Error('pesdb_invalid_page');const url=new URL(PESDB_BASE_URL);if(page>1)url.searchParams.set('page',String(page));const html=await fetchHtml(url.toString(),CATALOG_TTL_MS);const info=metadata(html);const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];const players:PesdbCatalogPlayer[]=[];for(const rowMatch of rows){const row=rowMatch[1];const id=row.match(/href\s*=\s*["'][^"']*[?&]id=(\d+)[^"']*["']/i)?.[1];if(!id)continue;const cells=[...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match=>cleanCell(match[1]));if(cells.length<8)continue;const[position,name,teamName,nationality,height,weight,age,overallRaw]=cells;const overall=numberOrNull(overallRaw);if(!position||!name||overall==null||overall<1||overall>100)continue;const source=new URL(PESDB_BASE_URL);source.searchParams.set('id',id);players.push({externalId:id,name,position,overall,nationality:nationality||null,teamName:teamName||null,height:numberOrNull(height),weight:numberOrNull(weight),age:numberOrNull(age),sourceUrl:source.toString()})}if(players.length===0)throw new Error('pesdb_catalog_parse_failed');const text=cleanCell(html);const totalPlayers=numberOrNull(text.match(/\(([\d, .]+)\s+players found\)/i)?.[1]?.replace(/[ ,.]/g,''));const estimatedPages=totalPlayers?Math.ceil(totalPlayers/players.length):null;return{page,totalPlayers,estimatedPages,players,...info}}
function field(lines:string[],label:string){const prefix=`${label}:`;const line=lines.find(item=>item.toLowerCase().startsWith(prefix.toLowerCase()));return line?line.slice(prefix.length).trim()||null:null}
function sectionValues(lines:string[],start:string,end:string){const startIndex=lines.findIndex(line=>line.toLowerCase()===start.toLowerCase());if(startIndex<0)return[];const endIndex=lines.findIndex((line,index)=>index>startIndex&&line.toLowerCase()===end.toLowerCase());const slice=lines.slice(startIndex+1,endIndex>startIndex?endIndex:undefined);return[...new Set(slice.filter(line=>line.length>0&&!line.includes(':')&&!/^image$/i.test(line)&&!/^share this player$/i.test(line)).slice(0,30))]}
export async function fetchPesdbPlayerDetail(externalId:string):Promise<PesdbPlayerDetail>{if(!/^\d+$/.test(externalId))throw new Error('pesdb_invalid_external_id');const url=new URL(PESDB_BASE_URL);url.searchParams.set('id',externalId);const html=await fetchHtml(url.toString(),DETAIL_TTL_MS);const info=metadata(html);const lines=documentLines(html);const name=field(lines,'Player Name');const position=field(lines,'Position');const overall=numberOrNull(field(lines,'Overall Rating'));if(!name||!position||overall==null)throw new Error('pesdb_detail_parse_failed');const abilities:Record<string,number>={};for(const label of ABILITY_LABELS){const value=numberOrNull(field(lines,label));if(value!=null)abilities[label]=value}const playingStyle=field(lines,'Playing Style')??(()=>{const i=lines.findIndex(line=>line==='Playing Style');return i>=0?lines[i+1]??null:null})();return{externalId,name,position,overall,nationality:field(lines,'Nationality'),teamName:field(lines,'Team Name'),height:numberOrNull(field(lines,'Height')),weight:numberOrNull(field(lines,'Weight')),age:numberOrNull(field(lines,'Age')),league:field(lines,'League'),region:field(lines,'Region'),foot:field(lines,'Foot'),maximumLevel:numberOrNull(field(lines,'Maximum Level')),rating:field(lines,'Rating'),playingStyle,playerSkills:sectionValues(lines,'Player Skills','AI Playing Styles'),aiPlayingStyles:sectionValues(lines,'AI Playing Styles','Share this player'),abilities,sourceUrl:url.toString(),providerVersion:info.providerVersion}}
