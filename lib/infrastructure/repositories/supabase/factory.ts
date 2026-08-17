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
  }
}

/**
 * Add service-role governance capabilities only after the caller has passed
 * server-side RBAC. Normal application repositories remain bound to the user's
 * RLS client even inside the backoffice.
 */
export function createAdminApplicationServices(userClient: SupabaseClient, serviceClient: SupabaseClient): AdminApplicationServices {
  return {
    ...createApplicationServices(userClient),
    governance: new SupabaseGovernanceRepository(serviceClient),
  }
}
