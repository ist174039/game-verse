import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubRepository } from '@/lib/application/contracts'
import type { Club, UUID } from '@/lib/domain/core'
import { mapClub } from './mappers'

export class SupabaseClubRepository implements ClubRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getById(id: UUID): Promise<Club | null> {
    const { data, error } = await this.client.from('club').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapClub(data) : null
  }

  async getForUserInUniverse(userId: UUID, universeId: UUID): Promise<Club | null> {
    const { data, error } = await this.client
      .from('club')
      .select('*')
      .eq('user_id', userId)
      .eq('universe_id', universeId)
      .maybeSingle()
    if (error) throw error
    return data ? mapClub(data) : null
  }
}
