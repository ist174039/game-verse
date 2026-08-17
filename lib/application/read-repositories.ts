import type { DashboardReadModel, OnboardingReadModel, SquadReadModel, UniverseDirectoryReadModel, UniverseOverviewReadModel } from './read-models'
import type { UUID } from '@/lib/domain/core'

/** Query-side repositories. These projections are optimized for UI composition and never expose database row shapes. */
export interface DashboardReadRepository {
  load(userId: UUID, universeId: UUID): Promise<DashboardReadModel | null>
}

export interface OnboardingReadRepository {
  load(userId: UUID): Promise<OnboardingReadModel>
}

export interface UniverseOverviewReadRepository {
  load(userId: UUID, universeId: UUID): Promise<UniverseOverviewReadModel | null>
}

export interface UniverseDirectoryReadRepository {
  load(userId: UUID): Promise<UniverseDirectoryReadModel>
}

export interface SquadReadRepository {
  load(userId: UUID, universeId: UUID): Promise<SquadReadModel | null>
}
