import type { CompetitionHubReadModel, DashboardReadModel, MarketReadModel, OnboardingReadModel, SquadReadModel, UniverseDirectoryReadModel, UniverseOverviewReadModel } from './read-models'
import type { UUID } from '@/lib/domain/core'

export interface DashboardReadRepository { load(userId: UUID, universeId: UUID): Promise<DashboardReadModel | null> }
export interface OnboardingReadRepository { load(userId: UUID): Promise<OnboardingReadModel> }
export interface UniverseOverviewReadRepository { load(userId: UUID, universeId: UUID): Promise<UniverseOverviewReadModel | null> }
export interface UniverseDirectoryReadRepository { load(userId: UUID): Promise<UniverseDirectoryReadModel> }
export interface SquadReadRepository { load(userId: UUID, universeId: UUID): Promise<SquadReadModel | null> }
export interface MarketReadRepository { load(userId: UUID, universeId: UUID): Promise<MarketReadModel | null> }
export interface CompetitionHubReadRepository { load(userId: UUID, universeId: UUID): Promise<CompetitionHubReadModel | null> }
