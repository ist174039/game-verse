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
import type { DashboardReadRepository, OnboardingReadRepository, SquadReadRepository, UniverseDirectoryReadRepository, UniverseOverviewReadRepository } from './read-repositories'

/** User-facing dependency container. Every repository is RLS-scoped to the authenticated user. */
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
  operations: OperationsRepository
  reads: {
    dashboard: DashboardReadRepository
    onboarding: OnboardingReadRepository
    universeOverview: UniverseOverviewReadRepository
    universeDirectory: UniverseDirectoryReadRepository
    squad: SquadReadRepository
  }
}

/** Backoffice-only extension. Must be created with a server-only service-role client after RBAC checks. */
export interface AdminApplicationServices extends ApplicationServices {
  governance: GovernanceRepository
}

export type ApplicationServiceName = keyof ApplicationServices
export type AdminApplicationServiceName = keyof AdminApplicationServices
