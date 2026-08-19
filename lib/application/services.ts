import type { ClubEconomyRepository, ClubRepository, CommunicationRepository, CompetitionRepository, GovernanceRepository, IdentityRepository, LedgerRepository, MarketRepository, OperationsRepository, PlayerRepository, RetentionRepository, SocialRepository, UniverseRepository } from './contracts'
import type { CompetitionAdminRepository } from './admin-contracts'
import type { AdminPlatformOverviewReadRepository, CalendarReadRepository, ClubOverviewReadRepository, CompetitionDetailReadRepository, CompetitionHubReadRepository, DashboardReadRepository, EconomyReadRepository, GoldCatalogReadRepository, MarketReadRepository, OnboardingReadRepository, ProfileReadRepository, RankingsReadRepository, SquadReadRepository, UniverseDirectoryReadRepository, UniverseOverviewReadRepository } from './read-repositories'

export interface ApplicationServices {
  identity: IdentityRepository; universes: UniverseRepository; clubs: ClubRepository; players: PlayerRepository; competitions: CompetitionRepository; market: MarketRepository; ledger: LedgerRepository; clubEconomy: ClubEconomyRepository; retention: RetentionRepository; communications: CommunicationRepository; social: SocialRepository; operations: OperationsRepository
  reads: { dashboard: DashboardReadRepository; onboarding: OnboardingReadRepository; universeOverview: UniverseOverviewReadRepository; universeDirectory: UniverseDirectoryReadRepository; squad: SquadReadRepository; market: MarketReadRepository; competitionHub: CompetitionHubReadRepository; competitionDetail: CompetitionDetailReadRepository; clubOverview: ClubOverviewReadRepository; profile: ProfileReadRepository; rankings: RankingsReadRepository; economy: EconomyReadRepository; goldCatalog: GoldCatalogReadRepository; calendar: CalendarReadRepository }
}
export interface AdminApplicationServices extends ApplicationServices { governance: GovernanceRepository; competitionAdmin: CompetitionAdminRepository; adminReads: { overview: AdminPlatformOverviewReadRepository } }
export type ApplicationServiceName = keyof ApplicationServices
export type AdminApplicationServiceName = keyof AdminApplicationServices
