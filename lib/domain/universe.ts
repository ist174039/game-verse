import type { FinancingPolicy } from './economy'

export type UniverseType = 'OFFICIAL' | 'COMMUNITY'
export type UniverseStatus =
  | 'DRAFT'
  | 'CONFIGURING'
  | 'OPEN_FOR_MEMBERS'
  | 'ACTIVE'
  | 'SEASON_RUNNING'
  | 'SEASON_CLOSED'
  | 'ARCHIVED'
  | 'SUSPENDED'
  | 'CANCELLED'

export type UniverseRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
export type JoinPolicy = 'PUBLIC' | 'APPLICATION' | 'INVITE_ONLY' | 'PRIVATE'
export type TransferPolicy = 'ALWAYS_OPEN' | 'TRANSFER_WINDOWS'

export interface UniverseEconomicProfile {
  startingSilver: number
  financingPolicy: FinancingPolicy
  externalFinancingLimitPercent: number | null
  marketFeePercent: number
  auctionFeePercent: number
  loansEnabled: boolean
}

export interface UniverseCompetitionRules {
  minimumSquadSize: number
  maximumSquadSize: number
  pointsWin: number
  pointsDraw: number
  pointsLoss: number
  transferPolicy: TransferPolicy
  resultConfirmationTimeoutHours: number
}

export interface Universe {
  id: string
  type: UniverseType
  name: string
  slug: string
  description: string | null
  ownerUserId: string | null
  status: UniverseStatus
  joinPolicy: JoinPolicy
  maxClubs: number
  economicProfile: UniverseEconomicProfile
  competitionRules: UniverseCompetitionRules
  createdAt: string
  updatedAt: string
}

export interface UniverseMembership {
  id: string
  universeId: string
  userId: string
  role: UniverseRole
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'LEFT'
  joinedAt: string | null
}

export const MAIN_UNIVERSE_POLICY = {
  type: 'OFFICIAL' as const,
  owner: 'PLATFORM' as const,
  rulesMutableByUsers: false,
  moderation: 'PLATFORM' as const,
  financingPolicy: 'STANDARD' as const,
  officialLeague: true,
  officialCup: true,
  superCup: true,
} as const
