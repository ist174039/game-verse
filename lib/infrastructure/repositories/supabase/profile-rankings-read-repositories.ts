import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileReadRepository, RankingsReadRepository } from '@/lib/application/read-repositories'
import type { ProfileReadModel, RankingEntryReadModel, RankingsReadModel } from '@/lib/application/read-models'
import type { UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse, mapUserProfile } from './mappers'

export class SupabaseProfileReadRepository implements ProfileReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(profileUserId: UUID): Promise<ProfileReadModel | null> {
    const profileQ = await this.client.from('user_profile').select('*').eq('id', profileUserId).maybeSingle()
    if (profileQ.error) throw profileQ.error
    if (!profileQ.data) return null

    const clubsQ = await this.client.from('club').select('*').eq('user_id', profileUserId).order('created_at', { ascending: true })
    if (clubsQ.error) throw clubsQ.error
    const clubs = clubsQ.data ?? []
    const universeIds = [...new Set(clubs.map((row: any) => row.universe_id as UUID))]
    const universesQ = universeIds.length > 0 ? await this.client.from('universe').select('*').in('id', universeIds) : { data: [], error: null }
    if (universesQ.error) throw universesQ.error
    const universes = new Map((universesQ.data ?? []).map((row: any) => [row.id as UUID, mapUniverse(row)]))

    return {
      profile: mapUserProfile(profileQ.data),
      clubs: clubs.flatMap((row: any) => {
        const universe = universes.get(row.universe_id)
        return universe ? [{ club: mapClub(row), universe }] : []
      }),
    }
  }
}

export class SupabaseRankingsReadRepository implements RankingsReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<RankingsReadModel | null> {
    const [universeQ, viewerClubQ, clubsQ] = await Promise.all([
      this.client.from('universe').select('*').eq('id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id', userId).eq('universe_id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('universe_id', universeId).order('elo', { ascending: false }).order('prestige', { ascending: false }).limit(100),
    ])
    if (universeQ.error) throw universeQ.error
    if (viewerClubQ.error) throw viewerClubQ.error
    if (clubsQ.error) throw clubsQ.error
    if (!universeQ.data || !viewerClubQ.data) return null

    const clubs = clubsQ.data ?? []
    const userIds = [...new Set(clubs.map((row: any) => row.user_id as UUID))]
    const profilesQ = userIds.length > 0 ? await this.client.from('user_profile').select('*').in('id', userIds) : { data: [], error: null }
    if (profilesQ.error) throw profilesQ.error
    const profiles = new Map((profilesQ.data ?? []).map((row: any) => [row.id as UUID, mapUserProfile(row)]))

    const entries: RankingEntryReadModel[] = clubs.flatMap((row: any, index: number) => {
      const manager = profiles.get(row.user_id)
      if (!manager) return []
      return [{
        rank: index + 1,
        club: mapClub(row),
        manager: { id: manager.id, username: manager.username, avatarUrl: manager.avatarUrl },
      }]
    })
    const viewerClub = mapClub(viewerClubQ.data)

    return {
      universe: mapUniverse(universeQ.data),
      viewerClub,
      viewerRank: entries.find(entry => entry.club.id === viewerClub.id)?.rank ?? null,
      entries,
    }
  }
}
