import type { AdminPlatformOverviewReadModel, CalendarReadModel, ClubOverviewReadModel, CompetitionDetailReadModel, CompetitionHubReadModel, DashboardReadModel, EconomyReadModel, GoldCatalogReadModel, MarketReadModel, OnboardingReadModel, ProfileReadModel, RankingsReadModel, SquadReadModel, UniverseDirectoryReadModel, UniverseOverviewReadModel } from './read-models'
import type { UUID } from '@/lib/domain/core'

export interface DashboardReadRepository { load(userId: UUID, universeId: UUID): Promise<DashboardReadModel | null> }
export interface OnboardingReadRepository { load(userId: UUID): Promise<OnboardingReadModel> }
export interface UniverseOverviewReadRepository { load(userId: UUID, universeId: UUID): Promise<UniverseOverviewReadModel | null> }
export interface UniverseDirectoryReadRepository { load(userId: UUID): Promise<UniverseDirectoryReadModel> }
export interface SquadReadRepository { load(userId: UUID, universeId: UUID): Promise<SquadReadModel | null> }
export interface MarketReadRepository { load(userId: UUID, universeId: UUID): Promise<MarketReadModel | null> }
export interface CompetitionHubReadRepository { load(userId: UUID, universeId: UUID): Promise<CompetitionHubReadModel | null> }
export interface CompetitionDetailReadRepository { load(userId: UUID, competitionId: UUID): Promise<CompetitionDetailReadModel | null> }
export interface ClubOverviewReadRepository { load(userId: UUID, universeId: UUID): Promise<ClubOverviewReadModel | null> }
export interface ProfileReadRepository { load(profileUserId: UUID): Promise<ProfileReadModel | null> }
export interface RankingsReadRepository { load(userId: UUID, universeId: UUID): Promise<RankingsReadModel | null> }
export interface EconomyReadRepository { load(userId: UUID, universeId: UUID): Promise<EconomyReadModel | null> }
export interface GoldCatalogReadRepository { load(userId: UUID): Promise<GoldCatalogReadModel> }
export interface CalendarReadRepository { load(userId: UUID, universeId: UUID): Promise<CalendarReadModel | null> }
export interface AdminPlatformOverviewReadRepository { load(): Promise<AdminPlatformOverviewReadModel> }
