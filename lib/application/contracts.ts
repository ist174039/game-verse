import type { Club, Competition, Match, MarketListing, PlayerMaster, Season, Universe, UniverseMembership, UniversePlayer, UserProfile, UUID } from '@/lib/domain/core'
import type { LedgerTransaction } from '@/lib/domain/economy'
import type { AuctionBid, PlayerProviderSnapshot, TransferReceipt, UniversePlayerValuation } from '@/lib/domain/player-market'

export interface IdentityRepository {
  getProfile(userId: UUID): Promise<UserProfile | null>
  ensureProfile(userId: UUID, input: { username: string; locale?: string }): Promise<UserProfile>
}

export interface UniverseRepository {
  getById(id: UUID): Promise<Universe | null>
  listAvailable(userId: UUID): Promise<Universe[]>
  joinPublic(universeId: UUID): Promise<UniverseMembership>
  createClub(input: { universeId: UUID; name: string; motto?: string | null; logoUrl?: string | null; idempotencyKey: string }): Promise<Club>
}

export interface ClubRepository {
  getById(id: UUID): Promise<Club | null>
  getForUserInUniverse(userId: UUID, universeId: UUID): Promise<Club | null>
}

export interface PlayerRepository {
  getMaster(id: UUID): Promise<PlayerMaster | null>
  getUniversePlayer(id: UUID): Promise<UniversePlayer | null>
  listClubSquad(clubId: UUID): Promise<UniversePlayer[]>
  listProviderSnapshots(playerId: UUID): Promise<PlayerProviderSnapshot[]>
  listValuations(universePlayerId: UUID): Promise<UniversePlayerValuation[]>
}

export interface CompetitionRepository {
  getSeason(id: UUID): Promise<Season | null>
  getCompetition(id: UUID): Promise<Competition | null>
  getMatch(id: UUID): Promise<Match | null>
}

export interface MarketRepository {
  getListing(id: UUID): Promise<MarketListing | null>
  listActive(universeId: UUID): Promise<MarketListing[]>
  listBids(listingId: UUID): Promise<AuctionBid[]>
  createDirectListing(input: { universePlayerId: UUID; askingPrice: number; idempotencyKey: string }): Promise<MarketListing>
  buyDirectListing(input: { listingId: UUID; idempotencyKey: string }): Promise<TransferReceipt>
  placeAuctionBid(input: { listingId: UUID; amount: number; idempotencyKey: string }): Promise<AuctionBid>
  settleAuction(input: { listingId: UUID; idempotencyKey: string }): Promise<TransferReceipt>
  cancelListing(input: { listingId: UUID; idempotencyKey: string }): Promise<void>
}

export interface LedgerRepository {
  getTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null>
}
