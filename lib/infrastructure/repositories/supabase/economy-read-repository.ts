import type { SupabaseClient } from '@supabase/supabase-js'
import type { EconomyReadRepository } from '@/lib/application/read-repositories'
import type { EconomyLedgerMovementReadModel, EconomyReadModel } from '@/lib/application/read-models'
import type { Club, Universe, UUID } from '@/lib/domain/core'
import type { ClubLoan, FinancialCycle, SponsorshipContract } from '@/lib/domain/club-economy'
import type { ClubLiability } from '@/lib/domain/operations'

const n = (value: unknown) => Number(value ?? 0)
const mapUniverse = (r: any): Universe => ({ id:r.id, kind:r.kind, name:r.name, slug:r.slug, description:r.description, ownerUserId:r.owner_user_id, state:r.state, accessPolicy:r.access_policy, economicProfile:r.economic_profile, financingPolicy:r.financing_policy, startingSilver:n(r.starting_silver), externalFinancingLimitPct:n(r.external_financing_limit_pct), marketFeePct:n(r.market_fee_pct), auctionFeePct:n(r.auction_fee_pct), minSquadSize:n(r.min_squad_size), maxSquadSize:n(r.max_squad_size), createdAt:r.created_at, updatedAt:r.updated_at })
const mapClub = (r:any): Club => ({ id:r.id, universeId:r.universe_id, userId:r.user_id, name:r.name, motto:r.motto, logoUrl:r.logo_url, prestige:n(r.prestige), fans:n(r.fans), elo:n(r.elo), reputationScore:n(r.reputation_score), createdAt:r.created_at, updatedAt:r.updated_at })
const mapSponsor = (r:any): SponsorshipContract => ({ id:r.id, universeId:r.universe_id, clubId:r.club_id, name:r.name, state:r.state, signingBonus:n(r.signing_bonus), periodicPayment:n(r.periodic_payment), objectiveBonus:n(r.objective_bonus), objectives:r.objectives ?? {}, startsAt:r.starts_at, endsAt:r.ends_at })
const mapLoan = (r:any): ClubLoan => ({ id:r.id, universeId:r.universe_id, clubId:r.club_id, principal:n(r.principal), outstandingPrincipal:n(r.outstanding_principal), interestRatePct:n(r.interest_rate_pct), installments:n(r.installments), installmentsPaid:n(r.installments_paid), state:r.state, originatedAt:r.originated_at, nextPaymentAt:r.next_payment_at })
const mapCycle = (r:any): FinancialCycle => ({ id:r.id, clubId:r.club_id, cycleKey:r.cycle_key, payroll:n(r.payroll), maintenance:n(r.maintenance), matchOperatingCost:n(r.match_operating_cost), sponsorshipIncome:n(r.sponsorship_income), stadiumIncome:n(r.stadium_income), otherIncome:n(r.other_income), netResult:n(r.net_result), settledAt:r.settled_at })
const mapLiability = (r:any): ClubLiability => ({ id:r.id, clubId:r.club_id, liabilityType:r.liability_type, referenceType:r.reference_type, referenceId:r.reference_id, amount:n(r.amount), outstandingAmount:n(r.outstanding_amount), state:r.state, dueAt:r.due_at, createdAt:r.created_at, updatedAt:r.updated_at })

export class SupabaseEconomyReadRepository implements EconomyReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<EconomyReadModel | null> {
    const [universeResult, clubResult, userAccountsResult] = await Promise.all([
      this.client.from('universe').select('*').eq('id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('universe_id', universeId).eq('user_id', userId).maybeSingle(),
      this.client.from('user_currency_account').select('id,currency,balance').eq('user_id', userId),
    ])
    if (universeResult.error) throw universeResult.error
    if (clubResult.error) throw clubResult.error
    if (userAccountsResult.error) throw userAccountsResult.error
    if (!universeResult.data || !clubResult.data) return null

    const club = mapClub(clubResult.data)
    const universe = mapUniverse(universeResult.data)
    const userAccounts = userAccountsResult.data ?? []
    const goldAccount = userAccounts.find((a:any) => a.currency === 'GOLD')
    const bronzeAccount = userAccounts.find((a:any) => a.currency === 'BRONZE')

    const [clubAccountResult, sponsorsResult, loansResult, cyclesResult, liabilitiesResult] = await Promise.all([
      this.client.from('club_currency_account').select('id,currency,balance').eq('club_id', club.id).eq('currency', 'SILVER').maybeSingle(),
      this.client.from('sponsorship_contract').select('*').eq('club_id', club.id).order('starts_at', { ascending:false }).limit(20),
      this.client.from('club_loan').select('*').eq('club_id', club.id).order('originated_at', { ascending:false }).limit(20),
      this.client.from('club_financial_cycle').select('*').eq('club_id', club.id).order('settled_at', { ascending:false, nullsFirst:false }).limit(12),
      this.client.from('club_liability').select('*').eq('club_id', club.id).order('created_at', { ascending:false }).limit(50),
    ])
    for (const result of [clubAccountResult, sponsorsResult, loansResult, cyclesResult, liabilitiesResult]) if (result.error) throw result.error

    const clubAccount = clubAccountResult.data
    const accountIds = userAccounts.map((a:any) => a.id)
    const ledgerEntryRows: any[] = []
    if (accountIds.length > 0) {
      const { data, error } = await this.client.from('ledger_entry').select('id,transaction_id,direction,currency,scope,user_account_id,club_account_id,amount,created_at').in('user_account_id', accountIds).order('created_at', { ascending:false }).limit(30)
      if (error) throw error
      ledgerEntryRows.push(...(data ?? []))
    }
    if (clubAccount?.id) {
      const { data, error } = await this.client.from('ledger_entry').select('id,transaction_id,direction,currency,scope,user_account_id,club_account_id,amount,created_at').eq('club_account_id', clubAccount.id).order('created_at', { ascending:false }).limit(30)
      if (error) throw error
      ledgerEntryRows.push(...(data ?? []))
    }

    const transactionIds = [...new Set(ledgerEntryRows.map(row => row.transaction_id))]
    const transactionsById = new Map<string, any>()
    if (transactionIds.length > 0) {
      const { data, error } = await this.client.from('ledger_transaction').select('id,transaction_type,reference_type,reference_id,reason,created_at').in('id', transactionIds)
      if (error) throw error
      for (const tx of data ?? []) transactionsById.set(tx.id, tx)
    }

    const movements: EconomyLedgerMovementReadModel[] = ledgerEntryRows
      .map(row => {
        const tx = transactionsById.get(row.transaction_id)
        return { entryId:row.id, transactionId:row.transaction_id, transactionType:tx?.transaction_type ?? 'UNKNOWN', direction:row.direction, currency:row.currency, scope:row.scope, amount:n(row.amount), reason:tx?.reason ?? null, referenceType:tx?.reference_type ?? null, referenceId:tx?.reference_id ?? null, createdAt:row.created_at }
      })
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30)

    const sponsorships = (sponsorsResult.data ?? []).map(mapSponsor)
    const loans = (loansResult.data ?? []).map(mapLoan)
    const cycles = (cyclesResult.data ?? []).map(mapCycle)
    const liabilities = (liabilitiesResult.data ?? []).map(mapLiability)
    const activeLoans = loans.filter(loan => loan.state === 'ACTIVE' || loan.state === 'DEFAULTED')
    const openLiabilities = liabilities.filter(item => item.state === 'OPEN' || item.state === 'PARTIALLY_PAID')
    const activeSponsors = sponsorships.filter(item => item.state === 'ACTIVE')

    return {
      universe,
      club,
      balances: { gold:n(goldAccount?.balance), bronze:n(bronzeAccount?.balance), silver:n(clubAccount?.balance) },
      sponsorships,
      loans,
      liabilities,
      cycles,
      movements,
      totals: {
        activeLoanPrincipal: activeLoans.reduce((sum, loan) => sum + loan.outstandingPrincipal, 0),
        openLiabilities: openLiabilities.reduce((sum, item) => sum + item.outstandingAmount, 0),
        activeSponsorshipPeriodicIncome: activeSponsors.reduce((sum, item) => sum + item.periodicPayment, 0),
        latestCycleNetResult: cycles.length > 0 ? cycles[0].netResult : null,
      },
    }
  }
}
