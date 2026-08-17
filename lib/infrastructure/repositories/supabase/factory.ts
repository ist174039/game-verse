import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminApplicationServices, ApplicationServices } from '@/lib/application/services'
import { SupabaseIdentityRepository } from './identity-repository'
import { SupabaseUniverseRepository } from './universe-repository'
import { SupabaseClubRepository } from './club-repository'
import { SupabasePlayerRepository, SupabaseMarketRepository } from './player-market-repositories'
import { SupabaseCompetitionRepository } from './competition-repository'
import { SupabaseLedgerRepository } from './ledger-repository'
import { SupabaseClubEconomyRepository } from './club-economy-repository'
import { SupabaseRetentionRepository } from './retention-repository'
import { SupabaseCommunicationRepository } from './communication-repository'
import { SupabaseSocialRepository } from './social-repository'
import { SupabaseOperationsRepository } from './operations-repository'
import { SupabaseGovernanceRepository } from './governance-repository'
import { SupabaseDashboardReadRepository, SupabaseOnboardingReadRepository, SupabaseUniverseOverviewReadRepository } from './read-repositories'
import { SupabaseUniverseDirectoryReadRepository } from './universe-directory-read-repository'
import { SupabaseSquadReadRepository } from './squad-read-repository'

/** Create RLS-scoped repositories for the authenticated application request. */
export function createApplicationServices(client: SupabaseClient): ApplicationServices {
  return {
    identity: new SupabaseIdentityRepository(client),
    universes: new SupabaseUniverseRepository(client),
    clubs: new SupabaseClubRepository(client),
    players: new SupabasePlayerRepository(client),
    competitions: new SupabaseCompetitionRepository(client),
    market: new SupabaseMarketRepository(client),
    ledger: new SupabaseLedgerRepository(client),
    clubEconomy: new SupabaseClubEconomyRepository(client),
    retention: new SupabaseRetentionRepository(client),
    communications: new SupabaseCommunicationRepository(client),
    social: new SupabaseSocialRepository(client),
    operations: new SupabaseOperationsRepository(client),
    reads: {
      dashboard: new SupabaseDashboardReadRepository(client),
      onboarding: new SupabaseOnboardingReadRepository(client),
      universeOverview: new SupabaseUniverseOverviewReadRepository(client),
      universeDirectory: new SupabaseUniverseDirectoryReadRepository(client),
      squad: new SupabaseSquadReadRepository(client),
    },
  }
}

/** Add service-role governance capabilities only after server-side RBAC. */
export function createAdminApplicationServices(userClient: SupabaseClient, serviceClient: SupabaseClient): AdminApplicationServices {
  return { ...createApplicationServices(userClient), governance: new SupabaseGovernanceRepository(serviceClient) }
}
