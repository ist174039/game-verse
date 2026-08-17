import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubRepository } from '@/lib/application/contracts'
import type { Club, UUID } from '@/lib/domain/core'
import type { InfrastructureType, InfrastructureUpgradeReceipt } from '@/lib/domain/club-economy'
import { mapClub } from './mappers'

const n = (value: unknown) => Number(value ?? 0)

export class SupabaseClubRepository implements ClubRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getById(id: UUID): Promise<Club | null> {
    const { data, error } = await this.client.from('club').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapClub(data) : null
  }

  async getForUserInUniverse(userId: UUID, universeId: UUID): Promise<Club | null> {
    const { data, error } = await this.client.from('club').select('*').eq('user_id', userId).eq('universe_id', universeId).maybeSingle()
    if (error) throw error
    return data ? mapClub(data) : null
  }

  async upgradeInfrastructure(input: { clubId: UUID; infrastructureType: InfrastructureType; idempotencyKey: string }): Promise<InfrastructureUpgradeReceipt> {
    const { data, error } = await this.client.rpc('upgrade_club_infrastructure', {
      p_club_id: input.clubId,
      p_infrastructure_type: input.infrastructureType,
      p_idempotency_key: input.idempotencyKey,
    })
    if (error) throw error
    return {
      clubId: data.club_id,
      infrastructureType: data.infrastructure_type,
      fromLevel: n(data.from_level),
      toLevel: n(data.to_level),
      costSilver: n(data.cost_silver),
      maintenanceCost: n(data.maintenance_cost),
      transactionId: data.transaction_id,
    }
  }
}
