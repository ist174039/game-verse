import type {
  ClubRepository,
  CompetitionRepository,
  IdentityRepository,
  LedgerRepository,
  MarketRepository,
  PlayerRepository,
  UniverseRepository,
} from './contracts'

/**
 * Explicit dependency container for application use cases.
 *
 * The UI/server actions receive this composition instead of importing Supabase
 * directly. The definitive Supabase project will provide the concrete adapters.
 */
export interface ApplicationServices {
  identity: IdentityRepository
  universes: UniverseRepository
  clubs: ClubRepository
  players: PlayerRepository
  competitions: CompetitionRepository
  market: MarketRepository
  ledger: LedgerRepository
}

export type ApplicationServiceName = keyof ApplicationServices
