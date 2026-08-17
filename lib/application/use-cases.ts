import type { Club, Universe, UniverseMembership } from '@/lib/domain/core'
import { canCreateClub, canJoinUniverse } from '@/lib/domain/invariants'
import type { UniverseRepository } from './contracts'

export class JoinUniverseUseCase {
  constructor(private readonly universes: UniverseRepository) {}

  async execute(universe: Universe): Promise<UniverseMembership> {
    if (!canJoinUniverse(universe)) throw new Error('universe_not_joinable')
    return this.universes.joinPublic(universe.id)
  }
}

export class CreateClubInUniverseUseCase {
  constructor(private readonly universes: UniverseRepository) {}

  async execute(input: { universe: Universe; name: string; motto?: string | null; logoUrl?: string | null; idempotencyKey: string }): Promise<Club> {
    if (!canCreateClub(input.universe)) throw new Error('universe_not_accepting_clubs')
    if (input.name.trim().length < 3) throw new Error('club_name_too_short')
    if (!input.idempotencyKey.trim()) throw new Error('idempotency_key_required')

    return this.universes.createClub({
      universeId: input.universe.id,
      name: input.name.trim(),
      motto: input.motto?.trim() || null,
      logoUrl: input.logoUrl ?? null,
      idempotencyKey: input.idempotencyKey,
    })
  }
}
