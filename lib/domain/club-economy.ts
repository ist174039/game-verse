import type { ISODateTime, UUID } from './core'

export type LoanState = 'OFFERED' | 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'CANCELLED'
export type SponsorshipState = 'OFFERED' | 'ACTIVE' | 'COMPLETED' | 'BREACHED' | 'CANCELLED'

export interface SponsorshipContract {
  id: UUID
  universeId: UUID
  clubId: UUID
  name: string
  state: SponsorshipState
  signingBonus: number
  periodicPayment: number
  objectiveBonus: number
  objectives: Record<string, unknown>
  startsAt: ISODateTime
  endsAt: ISODateTime | null
}

export interface ClubLoan {
  id: UUID
  universeId: UUID
  clubId: UUID
  principal: number
  outstandingPrincipal: number
  interestRatePct: number
  installments: number
  installmentsPaid: number
  state: LoanState
  originatedAt: ISODateTime
  nextPaymentAt: ISODateTime | null
}

export interface FinancialCycle {
  id: UUID
  clubId: UUID
  cycleKey: string
  payroll: number
  maintenance: number
  matchOperatingCost: number
  sponsorshipIncome: number
  stadiumIncome: number
  otherIncome: number
  netResult: number
  settledAt: ISODateTime | null
}

export interface GoldToSilverFinancingReceipt {
  userId: UUID
  clubId: UUID
  goldSpent: number
  silverCredited: number
  transactionId: UUID
}
