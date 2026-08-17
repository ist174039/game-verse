import type { SupabaseClient } from '@supabase/supabase-js'
import type { UniverseRepository } from '@/lib/application/contracts'
import type { Club, Universe, UniverseMembership, UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse, mapUniverseMembership } from './mappers'

export class SupabaseUniverseRepository implements UniverseRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getById(id: UUID): Promise<Universe | null> {
    const { data, error } = await this.client.from('universe').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapUniverse(data) : null
  }

  async listAvailable(userId: UUID): Promise<Universe[]> {
    const { data, error } = await this.client
      .from('universe')
      .select('*')
      .not('state', 'in', '(CANCELLED,ARCHIVED)')
      .order('kind', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapUniverse)
  }

  async joinPublic(universeId: UUID): Promise<UniverseMembership> {
    const { data, error } = await this.client.rpc('join_public_universe', { p_universe_id: universeId })
    if (error) throw error
    return mapUniverseMembership(data)
  }

  async createClub(input: { universeId: UUID; name: string; motto?: string | null; logoUrl?: string | null; idempotencyKey: string }): Promise<Club> {
    const { data, error } = await this.client.rpc('create_club_in_universe', {
      p_universe_id: input.universeId,
      p_name: input.name,
      p_motto: input.motto ?? null,
      p_logo_url: input.logoUrl ?? null,
      p_idempotency_key: input.idempotencyKey,
    })
    if (error) throw error
    return mapClub(data)
  }
}
