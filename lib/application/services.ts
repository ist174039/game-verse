import type {
  ClubEconomyRepository,
  ClubRepository,
  CommunicationRepository,
  CompetitionRepository,
  GovernanceRepository,
  IdentityRepository,
  LedgerRepository,
  MarketRepository,
  OperationsRepository,
  PlayerRepository,
  RetentionRepository,
  SocialRepository,
  UniverseRepository,
} from './contracts'

/** Explicit application dependency container. UI/server actions depend on this boundary, never on Supabase tables directly. */
export interface ApplicationServices {
  identity: IdentityRepository
  universes: UniverseRepository
  clubs: ClubRepository
  players: PlayerRepository
  competitions: CompetitionRepository
  market: MarketRepository
  ledger: LedgerRepository
  clubEconomy: ClubEconomyRepository
  retention: RetentionRepository
  communications: CommunicationRepository
  social: SocialRepository
  governance: GovernanceRepository
  operations: OperationsRepository
}

export type ApplicationServiceName = keyof ApplicationServices
