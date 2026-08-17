import type { UUID } from '@/lib/domain/core'

export interface CommandContext {
  actorUserId: UUID
  idempotencyKey: string
  reason?: string
}

export interface CreateClubCommand extends CommandContext {
  universeId: UUID
  name: string
  motto?: string | null
  logoUrl?: string | null
}

export interface CreateDirectListingCommand extends CommandContext {
  clubId: UUID
  universePlayerId: UUID
  askingPrice: number
}

export interface BuyDirectListingCommand extends CommandContext {
  buyerClubId: UUID
  listingId: UUID
}

export interface PlaceAuctionBidCommand extends CommandContext {
  bidderClubId: UUID
  listingId: UUID
  amount: number
}

export interface SubmitMatchResultCommand extends CommandContext {
  matchId: UUID
  homeScore: number
  awayScore: number
  evidencePaths?: string[]
}

export interface ConfirmMatchResultCommand extends CommandContext {
  matchId: UUID
}

export interface ReverseMatchSettlementCommand extends CommandContext {
  matchId: UUID
  adminUserId: UUID
}
