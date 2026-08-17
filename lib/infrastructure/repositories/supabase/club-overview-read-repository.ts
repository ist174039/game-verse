import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubOverviewReadRepository } from '@/lib/application/read-repositories'
import type { ClubInfrastructureReadModel, ClubOverviewReadModel } from '@/lib/application/read-models'
import type { UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse } from './mappers'

const num = (value: unknown) => Number(value ?? 0)

export class SupabaseClubOverviewReadRepository implements ClubOverviewReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<ClubOverviewReadModel | null> {
    const [universeQ, clubQ] = await Promise.all([
      this.client.from('universe').select('*').eq('id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id', userId).eq('universe_id', universeId).maybeSingle(),
    ])
    if (universeQ.error) throw universeQ.error
    if (clubQ.error) throw clubQ.error
    if (!universeQ.data || !clubQ.data) return null

    const club = mapClub(clubQ.data)
    const [accountQ, infraQ, matchesQ] = await Promise.all([
      this.client.from('club_currency_account').select('balance').eq('club_id', club.id).eq('currency', 'SILVER').maybeSingle(),
      this.client.from('club_infrastructure').select('id,infrastructure_type,level,maintenance_cost,updated_at').eq('club_id', club.id).order('infrastructure_type'),
      this.client.from('match').select('home_club_id,away_club_id,home_score,away_score').eq('universe_id', universeId).eq('state', 'SETTLED').or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`),
    ])
    if (accountQ.error) throw accountQ.error
    if (infraQ.error) throw infraQ.error
    if (matchesQ.error) throw matchesQ.error

    let won = 0
    let drawn = 0
    let lost = 0
    let goalsFor = 0
    let goalsAgainst = 0

    for (const row of matchesQ.data ?? []) {
      const isHome = row.home_club_id === club.id
      const scored = num(isHome ? row.home_score : row.away_score)
      const conceded = num(isHome ? row.away_score : row.home_score)
      goalsFor += scored
      goalsAgainst += conceded
      if (scored > conceded) won += 1
      else if (scored < conceded) lost += 1
      else drawn += 1
    }

    const played = won + drawn + lost
    const infrastructure: ClubInfrastructureReadModel[] = (infraQ.data ?? []).map((row: any) => ({
      id: row.id,
      type: row.infrastructure_type,
      level: num(row.level),
      maintenanceCost: num(row.maintenance_cost),
      updatedAt: row.updated_at,
    }))

    return {
      universe: mapUniverse(universeQ.data),
      club,
      silverBalance: num(accountQ.data?.balance),
      infrastructure,
      performance: {
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        winRatePct: played > 0 ? Math.round((won / played) * 100) : 0,
      },
    }
  }
}
