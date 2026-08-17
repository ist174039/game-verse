export type UUID = string
export type ISODateTime = string

export type CurrencyCode = 'GOLD' | 'SILVER' | 'BRONZE'
export type UniverseKind = 'MAIN' | 'COMMUNITY'
export type UniverseState = 'DRAFT' | 'CONFIGURING' | 'OPEN_FOR_MEMBERS' | 'ACTIVE' | 'SEASON_RUNNING' | 'SEASON_CLOSED' | 'SUSPENDED' | 'CANCELLED' | 'ARCHIVED'
export type UniverseAccessPolicy = 'PUBLIC' | 'APPLICATION' | 'INVITE_ONLY' | 'PRIVATE'
export type UniverseRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
export type CompetitionType = 'LEAGUE' | 'CUP' | 'TOURNAMENT' | 'FRIENDLY_EVENT'
export type MatchState = 'SCHEDULED' | 'READY' | 'PLAYED' | 'RESULT_SUBMITTED' | 'CONFIRMED' | 'DISPUTED' | 'AUTO_CONFIRMED' | 'SETTLED' | 'CANCELLED'
export type PlayerAssetStatus = 'AVAILABLE' | 'OWNED' | 'ACTIVE' | 'RESERVE' | 'LISTED' | 'AUCTION' | 'UNAVAILABLE' | 'FREE_AGENT'
export type ListingType = 'DIRECT' | 'AUCTION'
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED'

export interface UserProfile {
  id: UUID
  username: string
  avatarUrl: string | null
  locale: string
  managerLevel: number
  managerXp: number
  reputation: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface UserCurrencyAccount {
  id: UUID
  userId: UUID
  currency: Extract<CurrencyCode, 'GOLD' | 'BRONZE'>
  balance: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Universe {
  id: UUID
  kind: UniverseKind
  name: string
  slug: string
  description: string | null
  ownerUserId: UUID | null
  state: UniverseState
  accessPolicy: UniverseAccessPolicy
  economicProfile: 'HARDCORE' | 'COMPETITIVE' | 'STANDARD' | 'OPEN' | 'CUSTOM'
  financingPolicy: 'DISABLED' | 'LIMITED' | 'STANDARD' | 'OPEN'
  startingSilver: number
  externalFinancingLimitPct: number
  marketFeePct: number
  auctionFeePct: number
  minSquadSize: number
  maxSquadSize: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface UniverseMembership {
  id: UUID
  universeId: UUID
  userId: UUID
  role: UniverseRole
  joinedAt: ISODateTime
}

export interface Club {
  id: UUID
  universeId: UUID
  userId: UUID
  name: string
  motto: string | null
  logoUrl: string | null
  prestige: number
  fans: number
  elo: number
  reputationScore: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ClubCurrencyAccount {
  id: UUID
  clubId: UUID
  currency: 'SILVER'
  balance: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface PlayerMaster {
  id: UUID
  provider: string
  externalId: string
  providerVersion: string | null
  name: string
  position: string
  overall: number
  nationality: string | null
  imageUrl: string | null
  attributes: Record<string, unknown>
  popularityIndex: number | null
  updatedAt: ISODateTime
}

export interface UniversePlayer {
  id: UUID
  universeId: UUID
  playerId: UUID
  ownerClubId: UUID | null
  status: PlayerAssetStatus
  platformPrice: number
  marketReferenceValue: number
  salaryReference: number
  acquiredAt: ISODateTime | null
  updatedAt: ISODateTime
}

export interface PlayerContract {
  id: UUID
  universePlayerId: UUID
  clubId: UUID
  salary: number
  startSeasonId: UUID | null
  endSeasonId: UUID | null
  status: string
  clauses: Record<string, unknown>
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Season {
  id: UUID
  universeId: UUID
  name: string
  status: string
  startsAt: ISODateTime | null
  endsAt: ISODateTime | null
  registrationStartsAt: ISODateTime | null
  registrationEndsAt: ISODateTime | null
  rulesSnapshot: Record<string, unknown>
  createdAt: ISODateTime
}

export interface Competition {
  id: UUID
  universeId: UUID
  seasonId: UUID | null
  type: CompetitionType
  name: string
  status: string
  rules: Record<string, unknown>
  entryFee: number
  prizePool: number
  createdAt: ISODateTime
}

export interface Match {
  id: UUID
  universeId: UUID
  competitionId: UUID | null
  homeClubId: UUID
  awayClubId: UUID
  state: MatchState
  scheduledAt: ISODateTime | null
  homeScore: number | null
  awayScore: number | null
  submittedBy: UUID | null
  submittedAt: ISODateTime | null
  confirmedAt: ISODateTime | null
  settledAt: ISODateTime | null
  resultMetadata: Record<string, unknown>
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface MarketListing {
  id: UUID
  universeId: UUID
  universePlayerId: UUID
  sellerClubId: UUID
  listingType: ListingType
  status: ListingStatus
  askingPrice: number | null
  startsAt: ISODateTime
  endsAt: ISODateTime | null
  buyNowPrice: number | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}
