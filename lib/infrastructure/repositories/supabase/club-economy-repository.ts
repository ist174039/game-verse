import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubEconomyRepository } from '@/lib/application/contracts'
import type { ClubLoan, FinancialCycle, GoldToSilverFinancingReceipt, LoanRepaymentReceipt, SponsorshipContract } from '@/lib/domain/club-economy'
import type { UUID } from '@/lib/domain/core'

const n = (v: unknown) => Number(v ?? 0)
const mapLoan = (r:any):ClubLoan => ({
  id:r.id, universeId:r.universe_id, clubId:r.club_id, principal:n(r.principal), outstandingPrincipal:n(r.outstanding_principal),
  interestRatePct:n(r.interest_rate_pct), installments:n(r.installments), installmentsPaid:n(r.installments_paid), state:r.state,
  originatedAt:r.originated_at, nextPaymentAt:r.next_payment_at, totalInterest:n(r.total_interest), outstandingInterest:n(r.outstanding_interest), totalRepaid:n(r.total_repaid),
})

export class SupabaseClubEconomyRepository implements ClubEconomyRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listSponsorships(clubId: UUID): Promise<SponsorshipContract[]> {
    const { data, error } = await this.client.from('sponsorship_contract').select('*').eq('club_id', clubId).order('starts_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,universeId:r.universe_id,clubId:r.club_id,name:r.name,state:r.state,signingBonus:n(r.signing_bonus),periodicPayment:n(r.periodic_payment),objectiveBonus:n(r.objective_bonus),objectives:r.objectives??{},startsAt:r.starts_at,endsAt:r.ends_at}))
  }
  async listLoans(clubId: UUID): Promise<ClubLoan[]> {
    const { data, error } = await this.client.from('club_loan').select('*').eq('club_id', clubId).order('originated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapLoan)
  }
  async listFinancialCycles(clubId: UUID): Promise<FinancialCycle[]> {
    const { data, error } = await this.client.from('club_financial_cycle').select('*').eq('club_id', clubId).order('cycle_key', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,clubId:r.club_id,cycleKey:r.cycle_key,payroll:n(r.payroll),maintenance:n(r.maintenance),matchOperatingCost:n(r.match_operating_cost),sponsorshipIncome:n(r.sponsorship_income),stadiumIncome:n(r.stadium_income),otherIncome:n(r.other_income),netResult:n(r.net_result),settledAt:r.settled_at}))
  }
  async financeWithGold(input: { clubId: UUID; goldAmount: number; idempotencyKey: string }): Promise<GoldToSilverFinancingReceipt> {
    const { data, error } = await this.client.rpc('finance_club_with_gold', { p_club_id:input.clubId, p_gold_amount:input.goldAmount, p_idempotency_key:input.idempotencyKey })
    if (error) throw error
    return { userId:data.user_id, clubId:data.club_id, goldSpent:n(data.gold_spent), silverCredited:n(data.silver_credited), transactionId:data.transaction_id }
  }
  async originateLoan(input: { clubId: UUID; principal: number; idempotencyKey: string }): Promise<ClubLoan> {
    const { data, error } = await this.client.rpc('originate_club_loan', { p_club_id:input.clubId, p_principal:input.principal, p_idempotency_key:input.idempotencyKey })
    if (error) throw error
    return mapLoan(data)
  }
  async repayLoanInstallment(input: { loanId: UUID; idempotencyKey: string }): Promise<LoanRepaymentReceipt> {
    const { data, error } = await this.client.rpc('repay_club_loan_installment', { p_loan_id:input.loanId, p_idempotency_key:input.idempotencyKey })
    if (error) throw error
    return { loanId:data.loan_id, amount:n(data.amount), interestPaid:n(data.interest_paid), principalPaid:n(data.principal_paid), outstandingPrincipal:n(data.outstanding_principal), outstandingInterest:n(data.outstanding_interest), state:data.state, transactionId:data.transaction_id }
  }
}
