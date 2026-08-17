import type { ISODateTime, MarketListing, PlayerMaster, UniversePlayer, UUID } from './core'

export interface PlayerProviderSnapshot {
  id: UUID
  playerId: UUID
  provider: string
  externalId: string
  providerVersion: string | null
  overall: number
  attributes: Record<string, unknown>
  sourcePayload: Record<string, unknown>
  capturedAt: ISODateTime
}

export interface UniversePlayerValuation {
  id: UUID
  universePlayerId: UUID
  overall: number
  platformPrice: number
  marketReferenceValue: number
  salaryReference: number
  reason: 'PROVIDER_IMPORT' | 'PROVIDER_UPDATE' | 'MANUAL_RECALCULATION'
  createdAt: ISODateTime
}

export interface AuctionBid {
  id: UUID
  listingId: UUID
  bidderClubId: UUID
  amount: number
  createdAt: ISODateTime
}

export interface AuctionEscrow {
  id: UUID
  listingId: UUID
  bidderClubId: UUID
  amount: number
  status: 'HELD' | 'RELEASED' | 'SETTLED'
  ledgerTransactionId: UUID
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface PlayerMarketView {
  master: PlayerMaster
  asset: UniversePlayer
  listing: MarketListing | null
  highestBid: AuctionBid | null
}

export interface TransferReceipt {
  listingId: UUID
  universePlayerId: UUID
  sellerClubId: UUID
  buyerClubId: UUID
  grossAmount: number
  feeAmount: number
  sellerNetAmount: number
  ledgerTransactionId: UUID
}
