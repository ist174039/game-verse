import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardReadRepository, OnboardingReadRepository, UniverseOverviewReadRepository } from '@/lib/application/read-repositories'
import type { DashboardReadModel, OnboardingReadModel, UniverseOverviewReadModel } from '@/lib/application/read-models'
import type { UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse, mapUserProfile } from './mappers'

const num = (value: unknown) => Number(value ?? 0)

function mapMatch(row: any) {
  return {
    id: row.id,
    universeId: row.universe_id,
    competitionId: row.competition_id ?? null,
    homeClubId: row.home_club_id,
    awayClubId: row.away_club_id,
    state: row.state,
    scheduledAt: row.scheduled_at ?? null,
    homeScore: row.home_score == null ? null : num(row.home_score),
    awayScore: row.away_score == null ? null : num(row.away_score),
    submittedBy: row.submitted_by ?? null,
    submittedAt: row.submitted_at ?? null,
    confirmedAt: row.confirmed_at ?? null,
    settledAt: row.settled_at ?? null,
    resultMetadata: row.result_metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class SupabaseDashboardReadRepository implements DashboardReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<DashboardReadModel | null> {
    const [profileQ, universeQ, clubQ, globalAccountsQ] = await Promise.all([
      this.client.from('user_profile').select('*').eq('id',userId).maybeSingle(),
      this.client.from('universe').select('*').eq('id',universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id',userId).eq('universe_id',universeId).maybeSingle(),
      this.client.from('user_currency_account').select('currency,balance').eq('user_id',userId),
    ])
    for (const q of [profileQ,universeQ,clubQ,globalAccountsQ]) if (q.error) throw q.error
    if (!profileQ.data || !universeQ.data || !clubQ.data) return null

    const club = mapClub(clubQ.data)
    const [silverQ,matchesQ,marketQ,sponsorsQ,loansQ,liabilitiesQ,cyclesQ,journalQ,notificationsQ] = await Promise.all([
      this.client.from('club_currency_account').select('balance').eq('club_id',club.id).eq('currency','SILVER').maybeSingle(),
      this.client.from('match').select('*').eq('universe_id',universeId).or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`).order('scheduled_at',{ascending:true}),
      this.client.from('market_listing').select('*').eq('universe_id',universeId).eq('status','ACTIVE').order('created_at',{ascending:false}).limit(12),
      this.client.from('sponsorship_contract').select('*').eq('club_id',club.id).order('starts_at',{ascending:false}),
      this.client.from('club_loan').select('*').eq('club_id',club.id).order('originated_at',{ascending:false}),
      this.client.from('club_liability').select('*').eq('club_id',club.id).neq('state','PAID').order('created_at',{ascending:false}),
      this.client.from('club_financial_cycle').select('*').eq('club_id',club.id).order('created_at',{ascending:false}).limit(1),
      this.client.from('journal_article').select('*').eq('universe_id',universeId).order('published_at',{ascending:false}).limit(10),
      this.client.from('notification').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(20),
    ])
    for (const q of [silverQ,matchesQ,marketQ,sponsorsQ,loansQ,liabilitiesQ,cyclesQ,journalQ,notificationsQ]) if (q.error) throw q.error

    const matches=(matchesQ.data ?? []).map(mapMatch)
    const now=Date.now()
    const nextMatch=matches.find(m=>m.scheduledAt && new Date(m.scheduledAt).getTime()>=now && !['SETTLED','CANCELLED'].includes(m.state)) ?? null
    const recentMatches=matches.filter(m=>m.state==='SETTLED').sort((a,b)=>new Date(b.settledAt ?? b.updatedAt).getTime()-new Date(a.settledAt ?? a.updatedAt).getTime()).slice(0,5)
    const competitionId=nextMatch?.competitionId ?? recentMatches.find(m=>m.competitionId)?.competitionId ?? null
    let standings:any[]=[]
    if (competitionId) {
      const q=await this.client.from('league_standing').select('*').eq('competition_id',competitionId).order('position',{ascending:true})
      if (q.error) throw q.error
      standings=(q.data ?? []).map((r:any)=>({competitionId:r.competition_id,clubId:r.club_id,played:num(r.played),won:num(r.won),drawn:num(r.drawn),lost:num(r.lost),goalsFor:num(r.goals_for),goalsAgainst:num(r.goals_against),points:num(r.points),position:r.position==null?null:num(r.position),updatedAt:r.updated_at}))
    }

    const balances={gold:0,bronze:0,silver:num(silverQ.data?.balance)}
    for (const a of globalAccountsQ.data ?? []) {
      if (a.currency==='GOLD') balances.gold=num(a.balance)
      if (a.currency==='BRONZE') balances.bronze=num(a.balance)
    }

    return {
      user:mapUserProfile(profileQ.data), universe:mapUniverse(universeQ.data), club, currencies:balances,
      nextMatch,recentMatches,standings,
      activeMarketListings:(marketQ.data ?? []).map((r:any)=>({id:r.id,universeId:r.universe_id,universePlayerId:r.universe_player_id,sellerClubId:r.seller_club_id,listingType:r.listing_type,status:r.status,askingPrice:r.asking_price==null?null:num(r.asking_price),startsAt:r.starts_at,endsAt:r.ends_at ?? null,buyNowPrice:r.buy_now_price==null?null:num(r.buy_now_price),createdAt:r.created_at,updatedAt:r.updated_at})),
      economy:{
        sponsorships:(sponsorsQ.data ?? []).map((r:any)=>({id:r.id,universeId:r.universe_id,clubId:r.club_id,name:r.name,state:r.state,signingBonus:num(r.signing_bonus),periodicPayment:num(r.periodic_payment),objectiveBonus:num(r.objective_bonus),objectives:r.objectives ?? {},startsAt:r.starts_at,endsAt:r.ends_at ?? null})),
        loans:(loansQ.data ?? []).map((r:any)=>({id:r.id,universeId:r.universe_id,clubId:r.club_id,principal:num(r.principal),outstandingPrincipal:num(r.outstanding_principal),interestRatePct:num(r.interest_rate_pct),installments:num(r.installments),installmentsPaid:num(r.installments_paid),state:r.state,originatedAt:r.originated_at,nextPaymentAt:r.next_payment_at ?? null})),
        liabilities:(liabilitiesQ.data ?? []).map((r:any)=>({id:r.id,clubId:r.club_id,liabilityType:r.liability_type,referenceType:r.reference_type ?? null,referenceId:r.reference_id ?? null,amount:num(r.amount),outstandingAmount:num(r.outstanding_amount),state:r.state,dueAt:r.due_at ?? null,createdAt:r.created_at,updatedAt:r.updated_at})),
        latestCycle:cyclesQ.data?.[0] ? (()=>{const r:any=cyclesQ.data[0];return {id:r.id,clubId:r.club_id,cycleKey:r.cycle_key,payroll:num(r.payroll),maintenance:num(r.maintenance),matchOperatingCost:num(r.match_operating_cost),sponsorshipIncome:num(r.sponsorship_income),stadiumIncome:num(r.stadium_income),otherIncome:num(r.other_income),netResult:num(r.net_result),settledAt:r.settled_at ?? null}})() : null,
      },
      communications:{
        journal:(journalQ.data ?? []).map((r:any)=>({id:r.id,universeId:r.universe_id ?? null,eventId:r.event_id ?? null,category:r.category,title:r.title,summary:r.summary,body:r.body ?? null,importance:num(r.importance),publishedAt:r.published_at})),
        notifications:(notificationsQ.data ?? []).map((r:any)=>({id:r.id,userId:r.user_id,type:r.type,title:r.title,body:r.body,href:r.href ?? null,readAt:r.read_at ?? null,createdAt:r.created_at})),
      }
    }
  }
}

export class SupabaseOnboardingReadRepository implements OnboardingReadRepository {
  constructor(private readonly client: SupabaseClient) {}
  async load(userId: UUID): Promise<OnboardingReadModel> {
    const [profileQ,universesQ,clubsQ]=await Promise.all([
      this.client.from('user_profile').select('id').eq('id',userId).maybeSingle(),
      this.client.from('universe').select('*').not('state','in','(CANCELLED,ARCHIVED)').order('kind',{ascending:true}),
      this.client.from('club').select('universe_id').eq('user_id',userId),
    ])
    for (const q of [profileQ,universesQ,clubsQ]) if (q.error) throw q.error
    const availableUniverses=(universesQ.data ?? []).map(mapUniverse)
    const existingClubUniverseIds=(clubsQ.data ?? []).map((r:any)=>r.universe_id as UUID)
    const profileReady=Boolean(profileQ.data)
    return {userId,profileReady,availableUniverses,existingClubUniverseIds,nextStep:!profileReady?'IDENTITY':availableUniverses.length===0?'UNIVERSE':existingClubUniverseIds.length===0?'CLUB':'COMPLETE'}
  }
}

export class SupabaseUniverseOverviewReadRepository implements UniverseOverviewReadRepository {
  constructor(private readonly client: SupabaseClient) {}
  async load(userId: UUID, universeId: UUID): Promise<UniverseOverviewReadModel | null> {
    const [universeQ,clubQ]=await Promise.all([
      this.client.from('universe').select('*').eq('id',universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id',userId).eq('universe_id',universeId).maybeSingle(),
    ])
    if (universeQ.error) throw universeQ.error
    if (clubQ.error) throw clubQ.error
    if (!universeQ.data) return null
    let participantCompetitions:any[]=[]
    if (clubQ.data) {
      const q=await this.client.from('competition_participant').select('*').eq('club_id',clubQ.data.id)
      if (q.error) throw q.error
      participantCompetitions=(q.data ?? []).map((r:any)=>({id:r.id,competitionId:r.competition_id,clubId:r.club_id,seed:r.seed==null?null:num(r.seed),status:r.status,joinedAt:r.joined_at}))
    }
    return {universe:mapUniverse(universeQ.data),club:clubQ.data?mapClub(clubQ.data):null,participantCompetitions}
  }
}
