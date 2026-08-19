import type { ISODateTime, UUID } from './core'

export type LoanState = 'OFFERED' | 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'CANCELLED'
export type SponsorshipState = 'OFFERED' | 'ACTIVE' | 'COMPLETED' | 'BREACHED' | 'CANCELLED'
export type InfrastructureType = 'STADIUM' | 'ACADEMY' | 'TRAINING' | 'MARKETING' | 'FINANCE'

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
  totalInterest: number
  outstandingInterest: number
  totalRepaid: number
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
  cycleKey: string
  cycleGoldLimit: number
  cycleGoldSpent: number
  cycleGoldRemaining: number
}

export interface GoldFinancingStatus {
  enabled: boolean
  financingPolicy: string
  silverPerGold: number
  maxGoldPerOperation: number
  maxGoldPerCycle: number
  spentGoldThisCycle: number
  remainingGoldThisCycle: number
  maxSilverPerCycle: number
  remainingSilverThisCycle: number
  cycleKey: string
  resetsAt: ISODateTime
}

export interface InfrastructureUpgradeReceipt {
  clubId: UUID
  infrastructureType: InfrastructureType
  fromLevel: number
  toLevel: number
  costSilver: number
  maintenanceCost: number
  transactionId: UUID
}

export interface LoanRepaymentReceipt {
  loanId: UUID
  amount: number
  interestPaid: number
  principalPaid: number
  outstandingPrincipal: number
  outstandingInterest: number
  state: LoanState
  transactionId: UUID
}
