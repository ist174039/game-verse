import type { ISODateTime, UUID } from './core'

export interface ClubLiability {
  id: UUID
  clubId: UUID
  liabilityType: 'PAYROLL' | 'MAINTENANCE' | 'MATCH_COST' | 'LOAN_INSTALLMENT' | 'OTHER'
  referenceType: string | null
  referenceId: UUID | null
  amount: number
  outstandingAmount: number
  state: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED'
  dueAt: ISODateTime | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface MatchFinancialEvent {
  id: UUID
  matchId: UUID
  clubId: UUID
  stadiumIncome: number
  operatingCost: number
  attendance: number | null
  metadata: Record<string, unknown>
  createdAt: ISODateTime
}

export interface LedgerReversal {
  id: UUID
  originalTransactionId: UUID
  reversalTransactionId: UUID
  reason: string
  createdBy: UUID | null
  createdAt: ISODateTime
}

export interface CompetitionRegistration {
  id: UUID
  competitionId: UUID
  clubId: UUID
  state: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  registeredAt: ISODateTime
  approvedAt: ISODateTime | null
}

export interface CompetitionDivision {
  id: UUID
  competitionId: UUID
  code: string
  name: string
  level: number
  capacity: number | null
  promotionSlots: number
  relegationSlots: number
  metadata: Record<string, unknown>
}

export interface SeasonPlacement {
  id: UUID
  seasonId: UUID
  competitionId: UUID
  divisionId: UUID | null
  clubId: UUID
  finalPosition: number
  outcome: 'CHAMPION' | 'PROMOTED' | 'STAY' | 'RELEGATED' | 'ELIMINATED'
  snapshot: Record<string, unknown>
  createdAt: ISODateTime
}

export interface CupTie {
  id: UUID
  competitionId: UUID
  roundNumber: number
  tieNumber: number
  homeClubId: UUID | null
  awayClubId: UUID | null
  matchId: UUID | null
  winnerClubId: UUID | null
  state: 'PENDING' | 'READY' | 'PLAYED' | 'SETTLED'
}
