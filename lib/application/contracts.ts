import type { Club, Competition, Match, MarketListing, PlayerMaster, Season, Universe, UniverseMembership, UniversePlayer, UserProfile, UUID } from '@/lib/domain/core'
import type { LedgerTransaction } from '@/lib/domain/economy'

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
}

export interface CompetitionRepository {
  getSeason(id: UUID): Promise<Season | null>
  getCompetition(id: UUID): Promise<Competition | null>
  getMatch(id: UUID): Promise<Match | null>
}

export interface MarketRepository {
  getListing(id: UUID): Promise<MarketListing | null>
}

export interface LedgerRepository {
  getTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null>
}
