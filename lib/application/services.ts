import type { ClubEconomyRepository, ClubRepository, CommunicationRepository, CompetitionRepository, GovernanceRepository, IdentityRepository, LedgerRepository, MarketRepository, OperationsRepository, PlayerRepository, RetentionRepository, SocialRepository, UniverseRepository } from './contracts'
import type { CompetitionHubReadRepository, DashboardReadRepository, MarketReadRepository, OnboardingReadRepository, SquadReadRepository, UniverseDirectoryReadRepository, UniverseOverviewReadRepository } from './read-repositories'

export interface ApplicationServices {
  identity: IdentityRepository; universes: UniverseRepository; clubs: ClubRepository; players: PlayerRepository; competitions: CompetitionRepository; market: MarketRepository; ledger: LedgerRepository; clubEconomy: ClubEconomyRepository; retention: RetentionRepository; communications: CommunicationRepository; social: SocialRepository; operations: OperationsRepository
  reads: { dashboard: DashboardReadRepository; onboarding: OnboardingReadRepository; universeOverview: UniverseOverviewReadRepository; universeDirectory: UniverseDirectoryReadRepository; squad: SquadReadRepository; market: MarketReadRepository; competitionHub: CompetitionHubReadRepository }
}
export interface AdminApplicationServices extends ApplicationServices { governance: GovernanceRepository }
export type ApplicationServiceName = keyof ApplicationServices
export type AdminApplicationServiceName = keyof AdminApplicationServices
