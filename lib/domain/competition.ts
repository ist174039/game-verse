import type { ISODateTime, UUID } from './core'

export type SeasonState = 'DRAFT' | 'REGISTRATION' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
export type CompetitionState = 'DRAFT' | 'REGISTRATION' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type ParticipantStatus = 'PENDING' | 'ACTIVE' | 'ELIMINATED' | 'WITHDRAWN' | 'DISQUALIFIED' | 'CHAMPION'
export type DisputeState = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface CompetitionParticipant {
  id: UUID
  competitionId: UUID
  clubId: UUID
  seed: number | null
  status: ParticipantStatus
  joinedAt: ISODateTime
}

export interface CompetitionRound {
  id: UUID
  competitionId: UUID
  roundNumber: number
  name: string
  startsAt: ISODateTime | null
  endsAt: ISODateTime | null
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
}

export interface LeagueStanding {
  competitionId: UUID
  clubId: UUID
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  position: number | null
  updatedAt: ISODateTime
}

export interface MatchDispute {
  id: UUID
  matchId: UUID
  openedBy: UUID
  reason: string
  state: DisputeState
  resolution: string | null
  resolvedBy: UUID | null
  createdAt: ISODateTime
  resolvedAt: ISODateTime | null
}

export interface MatchSettlementReceipt {
  matchId: UUID
  settlementId: UUID
  version: number
  homeEloDelta: number
  awayEloDelta: number
  standingsUpdated: boolean
  settledAt: ISODateTime
}
