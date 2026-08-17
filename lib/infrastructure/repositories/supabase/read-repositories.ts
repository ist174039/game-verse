import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardReadRepository, OnboardingReadRepository, UniverseOverviewReadRepository } from '@/lib/application/read-repositories'
import type { DashboardReadModel, OnboardingReadModel, UniverseOverviewReadModel } from '@/lib/application/read-models'
import type { UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse, mapUserProfile } from './mappers'

const num=(value:unknown)=>Number(value??0)
function mapMatch(row:any){return{id:row.id,universeId:row.universe_id,competitionId:row.competition_id??null,homeClubId:row.home_club_id,awayClubId:row.away_club_id,state:row.state,scheduledAt:row.scheduled_at??null,homeScore:row.home_score==null?null:num(row.home_score),awayScore:row.away_score==null?null:num(row.away_score),submittedBy:row.submitted_by??null,submittedAt:row.submitted_at??null,confirmedAt:row.confirmed_at??null,settledAt:row.settled_at??null,resultMetadata:row.result_metadata??{},createdAt:row.created_at,updatedAt:row.updated_at}}
function warnOptional(name:string,error:{message?:string}|null){if(error)console.warn(`[dashboard:${name}]`,error.message??'query_failed')}

export class SupabaseDashboardReadRepository implements DashboardReadRepository {
  constructor(private readonly client:SupabaseClient){}
  async load(userId:UUID,universeId:UUID):Promise<DashboardReadModel|null>{
    const[profileQ,universeQ,clubQ]=await Promise.all([
      this.client.from('user_profile').select('*').eq('id',userId).maybeSingle(),
      this.client.from('universe').select('*').eq('id',universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id',userId).eq('universe_id',universeId).maybeSingle(),
    ])
    for(const q of[profileQ,universeQ,clubQ])if(q.error)throw q.error
    if(!profileQ.data||!universeQ.data||!clubQ.data)return null
    const club=mapClub(clubQ.data)

    const[globalAccountsQ,silverQ,upcomingQ,recentQ,marketQ,sponsorsQ,loansQ,liabilitiesQ,cyclesQ,journalQ,notificationsQ,squadQ,infraQ,registrationsQ,participantsQ,competitionsQ,unreadQ,settledCountQ]=await Promise.all([
      this.client.from('user_currency_account').select('currency,balance').eq('user_id',userId),
      this.client.from('club_currency_account').select('balance').eq('club_id',club.id).eq('currency','SILVER').maybeSingle(),
      this.client.from('match').select('*').eq('universe_id',universeId).or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`).not('state','in','(SETTLED,CANCELLED)').order('scheduled_at',{ascending:true}).limit(8),
      this.client.from('match').select('*').eq('universe_id',universeId).or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`).eq('state','SETTLED').order('updated_at',{ascending:false}).limit(5),
      this.client.from('market_listing').select('*').eq('universe_id',universeId).eq('status','ACTIVE').order('created_at',{ascending:false}).limit(12),
      this.client.from('sponsorship_contract').select('*').eq('club_id',club.id).order('starts_at',{ascending:false}),
      this.client.from('club_loan').select('*').eq('club_id',club.id).order('originated_at',{ascending:false}),
      this.client.from('club_liability').select('*').eq('club_id',club.id).neq('state','PAID').order('created_at',{ascending:false}),
      this.client.from('club_financial_cycle').select('*').eq('club_id',club.id).order('cycle_key',{ascending:false}).limit(1),
      this.client.from('journal_article').select('*').eq('universe_id',universeId).order('published_at',{ascending:false}).limit(10),
      this.client.from('notification').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(20),
      this.client.from('universe_player').select('id,status').eq('owner_club_id',club.id),
      this.client.from('club_infrastructure').select('id,infrastructure_type,level').eq('club_id',club.id),
      this.client.from('competition_registration').select('competition_id,state').eq('club_id',club.id),
      this.client.from('competition_participant').select('competition_id,status').eq('club_id',club.id),
      this.client.from('competition').select('id,status').eq('universe_id',universeId),
      this.client.from('notification').select('id',{count:'exact',head:true}).eq('user_id',userId).is('read_at',null),
      this.client.from('match').select('id',{count:'exact',head:true}).eq('universe_id',universeId).or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`).eq('state','SETTLED'),
    ])
    const optional=[['globalAccounts',globalAccountsQ],['silver',silverQ],['upcoming',upcomingQ],['recent',recentQ],['market',marketQ],['sponsors',sponsorsQ],['loans',loansQ],['liabilities',liabilitiesQ],['cycles',cyclesQ],['journal',journalQ],['notifications',notificationsQ],['squad',squadQ],['infrastructure',infraQ],['registrations',registrationsQ],['participants',participantsQ],['competitions',competitionsQ],['unread',unreadQ],['settledCount',settledCountQ]] as const
    for(const[name,q]of optional)warnOptional(name,q.error)

    const upcoming=(upcomingQ.error?[]:upcomingQ.data??[]).map(mapMatch)
    const recentMatches=(recentQ.error?[]:recentQ.data??[]).map(mapMatch)
    const nextMatch=upcoming[0]??null
    let nextMatchContext:DashboardReadModel['nextMatchContext']=null
    if(nextMatch){
      const clubIds=[nextMatch.homeClubId,nextMatch.awayClubId]
      const[clubsQ,competitionQ]=await Promise.all([
        this.client.from('club').select('id,name').in('id',clubIds),
        nextMatch.competitionId?this.client.from('competition').select('name').eq('id',nextMatch.competitionId).maybeSingle():Promise.resolve({data:null,error:null}),
      ])
      warnOptional('nextMatchClubs',clubsQ.error);warnOptional('nextMatchCompetition',competitionQ.error)
      const clubNames=new Map((clubsQ.error?[]:clubsQ.data??[]).map((r:any)=>[r.id,r.name]))
      nextMatchContext={match:nextMatch,homeClubName:String(clubNames.get(nextMatch.homeClubId)??'Clube da casa'),awayClubName:String(clubNames.get(nextMatch.awayClubId)??'Clube visitante'),competitionName:competitionQ.error?null:(competitionQ.data?.name??null)}
    }

    const competitionId=nextMatch?.competitionId??recentMatches.find(m=>m.competitionId)?.competitionId??null
    let standings:any[]=[]
    if(competitionId){const q=await this.client.from('league_standing').select('*').eq('competition_id',competitionId).order('position',{ascending:true});warnOptional('standings',q.error);if(!q.error)standings=(q.data??[]).map((r:any)=>({competitionId:r.competition_id,clubId:r.club_id,played:num(r.played),won:num(r.won),drawn:num(r.drawn),lost:num(r.lost),goalsFor:num(r.goals_for),goalsAgainst:num(r.goals_against),points:num(r.points),position:r.position==null?null:num(r.position),updatedAt:r.updated_at}))}

    const balances={gold:0,bronze:0,silver:silverQ.error?0:num(silverQ.data?.balance)}
    if(!globalAccountsQ.error)for(const a of globalAccountsQ.data??[]){if(a.currency==='GOLD')balances.gold=num(a.balance);if(a.currency==='BRONZE')balances.bronze=num(a.balance)}
    const marketRows=marketQ.error?[]:marketQ.data??[]
    const sponsorRows=sponsorsQ.error?[]:sponsorsQ.data??[]
    const loanRows=loansQ.error?[]:loansQ.data??[]
    const liabilityRows=liabilitiesQ.error?[]:liabilitiesQ.data??[]
    const registrationRows=registrationsQ.error?[]:registrationsQ.data??[]
    const participantRows=participantsQ.error?[]:participantsQ.data??[]
    const competitionRows=competitionsQ.error?[]:competitionsQ.data??[]

    return{
      user:mapUserProfile(profileQ.data),universe:mapUniverse(universeQ.data),club,currencies:balances,nextMatch,nextMatchContext,recentMatches,standings,
      activeMarketListings:marketRows.map((r:any)=>({id:r.id,universeId:r.universe_id,universePlayerId:r.universe_player_id,sellerClubId:r.seller_club_id,listingType:r.listing_type,status:r.status,askingPrice:r.asking_price==null?null:num(r.asking_price),startsAt:r.starts_at,endsAt:r.ends_at??null,buyNowPrice:r.buy_now_price==null?null:num(r.buy_now_price),createdAt:r.created_at,updatedAt:r.updated_at})),
      operational:{
        squadSize:(squadQ.error?[]:squadQ.data??[]).length,
        infrastructureCount:(infraQ.error?[]:infraQ.data??[]).length,
        registeredCompetitions:registrationRows.filter((r:any)=>['REGISTERED','APPROVED'].includes(r.state)).length,
        activeCompetitions:participantRows.filter((r:any)=>['ACTIVE','CHAMPION'].includes(r.status)).length,
        availableCompetitions:competitionRows.filter((r:any)=>r.status==='REGISTRATION').length,
        sponsorshipOffers:sponsorRows.filter((r:any)=>r.state==='OFFERED').length,
        activeMarketListings:marketRows.length,
        openLiabilities:liabilityRows.filter((r:any)=>['OPEN','PARTIALLY_PAID'].includes(r.state)).length,
        unreadNotifications:unreadQ.error?0:num(unreadQ.count),
        settledMatches:settledCountQ.error?recentMatches.length:num(settledCountQ.count),
      },
      economy:{
        sponsorships:sponsorRows.map((r:any)=>({id:r.id,universeId:r.universe_id,clubId:r.club_id,name:r.name,state:r.state,signingBonus:num(r.signing_bonus),periodicPayment:num(r.periodic_payment),objectiveBonus:num(r.objective_bonus),objectives:r.objectives??{},startsAt:r.starts_at,endsAt:r.ends_at??null})),
        loans:loanRows.map((r:any)=>({id:r.id,universeId:r.universe_id,clubId:r.club_id,principal:num(r.principal),outstandingPrincipal:num(r.outstanding_principal),interestRatePct:num(r.interest_rate_pct),installments:num(r.installments),installmentsPaid:num(r.installments_paid),state:r.state,originatedAt:r.originated_at,nextPaymentAt:r.next_payment_at??null,totalInterest:num(r.total_interest),outstandingInterest:num(r.outstanding_interest),totalRepaid:num(r.total_repaid)})),
        liabilities:liabilityRows.map((r:any)=>({id:r.id,clubId:r.club_id,liabilityType:r.liability_type,referenceType:r.reference_type??null,referenceId:r.reference_id??null,amount:num(r.amount),outstandingAmount:num(r.outstanding_amount),state:r.state,dueAt:r.due_at??null,createdAt:r.created_at,updatedAt:r.updated_at})),
        latestCycle:cyclesQ.error||!cyclesQ.data?.[0]?null:(()=>{const r:any=cyclesQ.data[0];return{id:r.id,clubId:r.club_id,cycleKey:r.cycle_key,payroll:num(r.payroll),maintenance:num(r.maintenance),matchOperatingCost:num(r.match_operating_cost),sponsorshipIncome:num(r.sponsorship_income),stadiumIncome:num(r.stadium_income),otherIncome:num(r.other_income),netResult:num(r.net_result),settledAt:r.settled_at??null}})(),
      },
      communications:{
        journal:(journalQ.error?[]:journalQ.data??[]).map((r:any)=>({id:r.id,universeId:r.universe_id??null,eventId:r.event_id??null,category:r.category,title:r.title,summary:r.summary,body:r.body??null,importance:num(r.importance),publishedAt:r.published_at})),
        notifications:(notificationsQ.error?[]:notificationsQ.data??[]).map((r:any)=>({id:r.id,userId:r.user_id,type:r.type,title:r.title,body:r.body,href:r.href??null,readAt:r.read_at??null,createdAt:r.created_at})),
      },
    }
  }
}

export class SupabaseOnboardingReadRepository implements OnboardingReadRepository {
  constructor(private readonly client:SupabaseClient){}
  async load(userId:UUID):Promise<OnboardingReadModel>{
    const[profileQ,universesQ,clubsQ]=await Promise.all([
      this.client.from('user_profile').select('id').eq('id',userId).maybeSingle(),
      this.client.from('universe').select('*').not('state','in','(CANCELLED,ARCHIVED)').order('kind',{ascending:true}),
      this.client.from('club').select('universe_id').eq('user_id',userId),
    ])
    for(const q of[profileQ,universesQ,clubsQ])if(q.error)throw q.error
    const availableUniverses=(universesQ.data??[]).map(mapUniverse),existingClubUniverseIds=(clubsQ.data??[]).map((r:any)=>r.universe_id as UUID),profileReady=Boolean(profileQ.data)
    return{userId,profileReady,availableUniverses,existingClubUniverseIds,nextStep:!profileReady?'IDENTITY':availableUniverses.length===0?'UNIVERSE':existingClubUniverseIds.length===0?'CLUB':'COMPLETE'}
  }
}

export class SupabaseUniverseOverviewReadRepository implements UniverseOverviewReadRepository {
  constructor(private readonly client:SupabaseClient){}
  async load(userId:UUID,universeId:UUID):Promise<UniverseOverviewReadModel|null>{
    const[universeQ,clubQ]=await Promise.all([this.client.from('universe').select('*').eq('id',universeId).maybeSingle(),this.client.from('club').select('*').eq('user_id',userId).eq('universe_id',universeId).maybeSingle()])
    if(universeQ.error)throw universeQ.error;if(clubQ.error)throw clubQ.error;if(!universeQ.data)return null
    let participantCompetitions:any[]=[]
    if(clubQ.data){const q=await this.client.from('competition_participant').select('*').eq('club_id',clubQ.data.id);if(q.error)throw q.error;participantCompetitions=(q.data??[]).map((r:any)=>({id:r.id,competitionId:r.competition_id,clubId:r.club_id,seed:r.seed==null?null:num(r.seed),status:r.status,joinedAt:r.joined_at}))}
    return{universe:mapUniverse(universeQ.data),club:clubQ.data?mapClub(clubQ.data):null,participantCompetitions}
  }
}
