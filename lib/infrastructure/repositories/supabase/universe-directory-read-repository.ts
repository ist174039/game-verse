import type { SupabaseClient } from '@supabase/supabase-js'
import type { UniverseDirectoryReadRepository } from '@/lib/application/read-repositories'
import type { UniverseDirectoryReadModel } from '@/lib/application/read-models'
import type { UUID, UniverseRole } from '@/lib/domain/core'
import { mapClub, mapUniverse } from './mappers'

export class SupabaseUniverseDirectoryReadRepository implements UniverseDirectoryReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID): Promise<UniverseDirectoryReadModel> {
    const [universesQ, clubsQ, membershipsQ] = await Promise.all([
      this.client.from('universe').select('*').not('state', 'in', '(CANCELLED,ARCHIVED)').order('kind', { ascending: true }).order('name', { ascending: true }),
      this.client.from('club').select('*').eq('user_id', userId),
      this.client.from('universe_membership').select('universe_id,role').eq('user_id', userId),
    ])

    for (const query of [universesQ, clubsQ, membershipsQ]) if (query.error) throw query.error

    const clubsByUniverse = new Map((clubsQ.data ?? []).map((row: any) => [row.universe_id as UUID, mapClub(row)]))
    const rolesByUniverse = new Map((membershipsQ.data ?? []).map((row: any) => [row.universe_id as UUID, row.role as UniverseRole]))

    const entries = (universesQ.data ?? []).map((row: any) => {
      const universe = mapUniverse(row)
      return {
        universe,
        club: clubsByUniverse.get(universe.id) ?? null,
        membershipRole: rolesByUniverse.get(universe.id) ?? null,
      }
    })

    return {
      entries,
      managedUniverseIds: entries.filter(entry => entry.club !== null).map(entry => entry.universe.id),
    }
  }
}
