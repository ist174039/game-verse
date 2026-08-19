import type { SupabaseClient } from '@supabase/supabase-js'
import type { CalendarReadRepository } from '@/lib/application/read-repositories'
import type { CalendarMatchReadModel, CalendarReadModel, CalendarSeasonEventReadModel } from '@/lib/application/read-models'
import type { Match, UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse } from './mappers'

const num=(value:unknown)=>Number(value??0)
const mapMatch=(row:any):Match=>({id:row.id,universeId:row.universe_id,competitionId:row.competition_id??null,homeClubId:row.home_club_id,awayClubId:row.away_club_id,state:row.state,scheduledAt:row.scheduled_at??null,homeScore:row.home_score==null?null:num(row.home_score),awayScore:row.away_score==null?null:num(row.away_score),submittedBy:row.submitted_by??null,submittedAt:row.submitted_at??null,confirmedAt:row.confirmed_at??null,settledAt:row.settled_at??null,resultMetadata:row.result_metadata??{},createdAt:row.created_at,updatedAt:row.updated_at})

export class SupabaseCalendarReadRepository implements CalendarReadRepository {
  constructor(private readonly client:SupabaseClient){}

  async load(userId:UUID,universeId:UUID):Promise<CalendarReadModel|null>{
    const[universeQ,clubQ]=await Promise.all([
      this.client.from('universe').select('*').eq('id',universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id',userId).eq('universe_id',universeId).maybeSingle(),
    ])
    if(universeQ.error)throw universeQ.error
    if(clubQ.error)throw clubQ.error
    if(!universeQ.data||!clubQ.data)return null
    const club=mapClub(clubQ.data)

    const[matchesQ,seasonsQ]=await Promise.all([
      this.client.from('match').select('*').eq('universe_id',universeId).or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`).order('scheduled_at',{ascending:true}).limit(250),
      this.client.from('season').select('id,name,status,registration_starts_at,registration_ends_at,starts_at,ends_at').eq('universe_id',universeId).order('created_at',{ascending:false}).limit(20),
    ])
    if(matchesQ.error)throw matchesQ.error
    if(seasonsQ.error)throw seasonsQ.error

    const matches=(matchesQ.data??[]).map(mapMatch)
    const clubIds=[...new Set(matches.flatMap(match=>[match.homeClubId,match.awayClubId]))]
    const competitionIds=[...new Set(matches.map(match=>match.competitionId).filter((id):id is UUID=>Boolean(id)))]
    const roundIds=[...new Set((matchesQ.data??[]).map((row:any)=>row.round_id as UUID|null).filter((id):id is UUID=>Boolean(id)))]

    const[clubsQ,competitionsQ,roundsQ]=await Promise.all([
      clubIds.length?this.client.from('club').select('id,name').in('id',clubIds):Promise.resolve({data:[],error:null}),
      competitionIds.length?this.client.from('competition').select('id,name,type').in('id',competitionIds):Promise.resolve({data:[],error:null}),
      roundIds.length?this.client.from('competition_round').select('id,name,round_number').in('id',roundIds):Promise.resolve({data:[],error:null}),
    ])
    if(clubsQ.error)throw clubsQ.error
    if(competitionsQ.error)throw competitionsQ.error
    if(roundsQ.error)throw roundsQ.error

    const clubNames=new Map((clubsQ.data??[]).map((row:any)=>[row.id as UUID,String(row.name)]))
    const competitions=new Map((competitionsQ.data??[]).map((row:any)=>[row.id as UUID,{name:String(row.name),type:String(row.type)}]))
    const rounds=new Map((roundsQ.data??[]).map((row:any)=>[row.id as UUID,{name:String(row.name),roundNumber:num(row.round_number)}]))

    const entries:CalendarMatchReadModel[]=matches.map((match,index)=>{
      const raw=(matchesQ.data??[])[index] as any
      const competition=match.competitionId?competitions.get(match.competitionId):undefined
      const round=raw?.round_id?rounds.get(raw.round_id as UUID):undefined
      return{
        match,
        homeClubName:clubNames.get(match.homeClubId)??'Clube da casa',
        awayClubName:clubNames.get(match.awayClubId)??'Clube visitante',
        competitionName:competition?.name??null,
        competitionType:competition?.type??null,
        roundName:round?.name??null,
        roundNumber:round?.roundNumber??null,
      }
    })

    const seasonEvents:CalendarSeasonEventReadModel[]=[]
    for(const row of seasonsQ.data??[]){
      const base={seasonId:row.id as UUID,seasonName:String(row.name)}
      if(row.registration_starts_at)seasonEvents.push({...base,id:`${row.id}:registration-start`,kind:'REGISTRATION_START',title:`Abertura de inscrições · ${row.name}`,at:row.registration_starts_at})
      if(row.registration_ends_at)seasonEvents.push({...base,id:`${row.id}:registration-end`,kind:'REGISTRATION_END',title:`Fecho de inscrições · ${row.name}`,at:row.registration_ends_at})
      if(row.starts_at)seasonEvents.push({...base,id:`${row.id}:season-start`,kind:'SEASON_START',title:`Início da época · ${row.name}`,at:row.starts_at})
      if(row.ends_at)seasonEvents.push({...base,id:`${row.id}:season-end`,kind:'SEASON_END',title:`Fim da época · ${row.name}`,at:row.ends_at})
    }
    seasonEvents.sort((a,b)=>new Date(a.at).getTime()-new Date(b.at).getTime())

    return{universe:mapUniverse(universeQ.data),club,matches:entries,seasonEvents}
  }
}
