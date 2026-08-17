export type CompetitionType = 'LEAGUE' | 'CUP' | 'TOURNAMENT' | 'FRIENDLY' | 'CASUAL'

export type MatchStatus =
  | 'SCHEDULED'
  | 'READY'
  | 'PLAYED'
  | 'RESULT_SUBMITTED'
  | 'CONFIRMED'
  | 'DISPUTED'
  | 'AUTO_CONFIRMED'
  | 'SETTLED'
  | 'CANCELLED'

export interface MatchResultSubmission {
  submittedByUserId: string
  homeScore: number
  awayScore: number
  screenshotUrl: string | null
  submittedAt: string
}

export interface Match {
  id: string
  universeId: string
  competitionId: string | null
  competitionType: CompetitionType
  seasonId: string | null
  homeClubId: string
  awayClubId: string
  status: MatchStatus
  scheduledAt: string | null
  result: MatchResultSubmission | null
  settledAt: string | null
  createdAt: string
  updatedAt: string
}

export type SettlementEffect =
  | 'COMPETITION_TABLE'
  | 'ELO'
  | 'SILVER_REVENUE'
  | 'SILVER_COSTS'
  | 'FANS'
  | 'SPONSOR_OBJECTIVES'
  | 'DISCIPLINE'
  | 'STATISTICS'
  | 'JOURNAL_EVENT'

export interface MatchSettlement {
  id: string
  matchId: string
  version: number
  idempotencyKey: string
  effects: SettlementEffect[]
  reversedSettlementId: string | null
  settledAt: string
}

export const MATCH_INVARIANTS = {
  effectsOnlyAfterSettlement: true,
  directMutationAfterSettlement: false,
  correctionStrategy: 'REVERSAL_THEN_NEW_SETTLEMENT',
  settlementMustBeIdempotent: true,
} as const
