import type { SupabaseClient } from '@supabase/supabase-js'
import type { IdentityRepository } from '@/lib/application/contracts'
import type { UserProfile, UUID } from '@/lib/domain/core'
import { mapUserProfile } from './mappers'

export class SupabaseIdentityRepository implements IdentityRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getProfile(userId: UUID): Promise<UserProfile | null> {
    const { data, error } = await this.client.from('user_profile').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    return data ? mapUserProfile(data) : null
  }

  async ensureProfile(userId: UUID, input: { username: string; locale?: string }): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('user_profile')
      .upsert({ id: userId, username: input.username.trim(), locale: input.locale ?? 'pt' }, { onConflict: 'id' })
      .select('*')
      .single()
    if (error) throw error
    return mapUserProfile(data)
  }
}
