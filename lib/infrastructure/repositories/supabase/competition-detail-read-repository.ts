import type { SupabaseClient } from '@supabase/supabase-js'
import type { CompetitionDetailReadRepository } from '@/lib/application/read-repositories'
import type { CompetitionCupTieReadModel, CompetitionDetailReadModel, CompetitionFixtureReadModel, CompetitionParticipantReadModel, CompetitionStandingReadModel } from '@/lib/application/read-models'
import type { Club, Competition, Match, Season, Universe, UUID } from '@/lib/domain/core'
import type { CompetitionParticipant, CompetitionRound, LeagueStanding } from '@/lib/domain/competition'
import type { CompetitionDivision, CompetitionRegistration, CupTie } from '@/lib/domain/operations'

const n = (value: unknown) => Number(value ?? 0)
const mapUniverse = (r:any):Universe => ({id:r.id,kind:r.kind,name:r.name,slug:r.slug,description:r.description,ownerUserId:r.owner_user_id,state:r.state,accessPolicy:r.access_policy,economicProfile:r.economic_profile,financingPolicy:r.financing_policy,startingSilver:n(r.starting_silver),externalFinancingLimitPct:n(r.external_financing_limit_pct),marketFeePct:n(r.market_fee_pct),auctionFeePct:n(r.auction_fee_pct),minSquadSize:n(r.min_squad_size),maxSquadSize:n(r.max_squad_size),createdAt:r.created_at,updatedAt:r.updated_at})
const mapClub = (r:any):Club => ({id:r.id,universeId:r.universe_id,userId:r.user_id,name:r.name,motto:r.motto,logoUrl:r.logo_url,prestige:n(r.prestige),fans:n(r.fans),elo:n(r.elo),reputationScore:n(r.reputation_score),createdAt:r.created_at,updatedAt:r.updated_at})
const mapCompetition = (r:any):Competition => ({id:r.id,universeId:r.universe_id,seasonId:r.season_id,type:r.type,name:r.name,status:r.status,rules:r.rules??{},entryFee:n(r.entry_fee),prizePool:n(r.prize_pool),createdAt:r.created_at})
const mapSeason = (r:any):Season => ({id:r.id,universeId:r.universe_id,name:r.name,status:r.status,startsAt:r.starts_at,endsAt:r.ends_at,registrationStartsAt:r.registration_starts_at,registrationEndsAt:r.registration_ends_at,rulesSnapshot:r.rules_snapshot??{},createdAt:r.created_at})
const mapMatch = (r:any):Match => ({id:r.id,universeId:r.universe_id,competitionId:r.competition_id,homeClubId:r.home_club_id,awayClubId:r.away_club_id,state:r.state,scheduledAt:r.scheduled_at,homeScore:r.home_score===null?null:n(r.home_score),awayScore:r.away_score===null?null:n(r.away_score),submittedBy:r.submitted_by,submittedAt:r.submitted_at,confirmedAt:r.confirmed_at,settledAt:r.settled_at,resultMetadata:r.result_metadata??{},createdAt:r.created_at,updatedAt:r.updated_at})
const mapParticipant=(r:any):CompetitionParticipant=>({id:r.id,competitionId:r.competition_id,clubId:r.club_id,seed:r.seed,status:r.status,joinedAt:r.joined_at})
const mapRound=(r:any):CompetitionRound=>({id:r.id,competitionId:r.competition_id,roundNumber:n(r.round_number),name:r.name,startsAt:r.starts_at,endsAt:r.ends_at,status:r.status})
const mapStanding=(r:any):LeagueStanding=>({competitionId:r.competition_id,clubId:r.club_id,played:n(r.played),won:n(r.won),drawn:n(r.drawn),lost:n(r.lost),goalsFor:n(r.goals_for),goalsAgainst:n(r.goals_against),points:n(r.points),position:r.position===null?null:n(r.position),updatedAt:r.updated_at})
const mapRegistration=(r:any):CompetitionRegistration=>({id:r.id,competitionId:r.competition_id,clubId:r.club_id,state:r.state,registeredAt:r.registered_at,approvedAt:r.approved_at,entryFeePaid:n(r.entry_fee_paid),ledgerTransactionId:r.ledger_transaction_id??null,idempotencyKey:r.idempotency_key??null})
const mapDivision=(r:any):CompetitionDivision=>({id:r.id,competitionId:r.competition_id,code:r.code,name:r.name,level:n(r.level),capacity:r.capacity===null?null:n(r.capacity),promotionSlots:n(r.promotion_slots),relegationSlots:n(r.relegation_slots),metadata:r.metadata??{}})
const mapTie=(r:any):CupTie=>({id:r.id,competitionId:r.competition_id,roundNumber:n(r.round_number),tieNumber:n(r.tie_number),homeClubId:r.home_club_id,awayClubId:r.away_club_id,matchId:r.match_id,winnerClubId:r.winner_club_id,state:r.state})

export class SupabaseCompetitionDetailReadRepository implements CompetitionDetailReadRepository {
  constructor(private readonly client: SupabaseClient) {}
  async load(userId:UUID, competitionId:UUID):Promise<CompetitionDetailReadModel|null>{
    const {data:compRow,error:compError}=await this.client.from('competition').select('*').eq('id',competitionId).maybeSingle()
    if(compError) throw compError
    if(!compRow) return null
    const competition=mapCompetition(compRow)

    const [universeResult,seasonResult,viewerClubResult,participantsResult,roundsResult,standingsResult,matchesResult,divisionsResult,tiesResult]=await Promise.all([
      this.client.from('universe').select('*').eq('id',competition.universeId).maybeSingle(),
      competition.seasonId ? this.client.from('season').select('*').eq('id',competition.seasonId).maybeSingle() : Promise.resolve({data:null,error:null}),
      this.client.from('club').select('*').eq('universe_id',competition.universeId).eq('user_id',userId).maybeSingle(),
      this.client.from('competition_participant').select('*').eq('competition_id',competitionId).order('seed',{ascending:true}),
      this.client.from('competition_round').select('*').eq('competition_id',competitionId).order('round_number',{ascending:true}),
      this.client.from('league_standing').select('*').eq('competition_id',competitionId).order('position',{ascending:true,nullsFirst:false}).order('points',{ascending:false}),
      this.client.from('match').select('*,round_id,leg,matchday').eq('competition_id',competitionId).order('scheduled_at',{ascending:true,nullsFirst:false}),
      this.client.from('competition_division').select('*').eq('competition_id',competitionId).order('level',{ascending:true}),
      this.client.from('cup_tie').select('*').eq('competition_id',competitionId).order('round_number',{ascending:true}).order('tie_number',{ascending:true}),
    ])
    for(const result of [universeResult,seasonResult,viewerClubResult,participantsResult,roundsResult,standingsResult,matchesResult,divisionsResult,tiesResult]) if(result.error) throw result.error
    if(!universeResult.data) return null

    const viewerClub=viewerClubResult.data?mapClub(viewerClubResult.data):null
    let registration:CompetitionRegistration|null=null
    if(viewerClub){ const {data,error}=await this.client.from('competition_registration').select('*').eq('competition_id',competitionId).eq('club_id',viewerClub.id).maybeSingle(); if(error) throw error; registration=data?mapRegistration(data):null }

    const participantRows=participantsResult.data??[]
    const standingRows=standingsResult.data??[]
    const matchRows=matchesResult.data??[]
    const tieRows=tiesResult.data??[]
    const clubIds=[...new Set([...participantRows.map((r:any)=>r.club_id),...standingRows.map((r:any)=>r.club_id),...matchRows.flatMap((r:any)=>[r.home_club_id,r.away_club_id]),...tieRows.flatMap((r:any)=>[r.home_club_id,r.away_club_id,r.winner_club_id]).filter(Boolean)])]
    const clubsById=new Map<string,Club>()
    if(clubIds.length>0){ const {data,error}=await this.client.from('club').select('*').in('id',clubIds); if(error) throw error; for(const row of data??[]) clubsById.set(row.id,mapClub(row)) }
    const rounds=(roundsResult.data??[]).map(mapRound)
    const roundsById=new Map(rounds.map(round=>[round.id,round]))

    const participants:CompetitionParticipantReadModel[] = participantRows.map((row:any)=>({participant:mapParticipant(row),club:clubsById.get(row.club_id)!})).filter(item=>Boolean(item.club))
    const standings:CompetitionStandingReadModel[] = standingRows.map((row:any)=>({standing:mapStanding(row),club:clubsById.get(row.club_id)!})).filter(item=>Boolean(item.club))
    const fixtures:CompetitionFixtureReadModel[] = matchRows.map((row:any)=>{ const round=row.round_id?roundsById.get(row.round_id):null; return {match:mapMatch(row),homeClub:clubsById.get(row.home_club_id)!,awayClub:clubsById.get(row.away_club_id)!,roundId:row.round_id,roundNumber:round?.roundNumber??null,roundName:round?.name??null,leg:n(row.leg)||1,matchday:row.matchday===null?null:n(row.matchday)} }).filter(item=>Boolean(item.homeClub&&item.awayClub))
    const cupTies:CompetitionCupTieReadModel[] = tieRows.map((row:any)=>({tie:mapTie(row),homeClub:row.home_club_id?clubsById.get(row.home_club_id)??null:null,awayClub:row.away_club_id?clubsById.get(row.away_club_id)??null:null,winnerClub:row.winner_club_id?clubsById.get(row.winner_club_id)??null:null}))

    return {universe:mapUniverse(universeResult.data),competition,season:seasonResult.data?mapSeason(seasonResult.data):null,viewerClub,registration,participants,rounds,standings,fixtures,divisions:(divisionsResult.data??[]).map(mapDivision),cupTies}
  }
}
