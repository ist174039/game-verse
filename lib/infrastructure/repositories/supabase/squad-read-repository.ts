import type { SupabaseClient } from '@supabase/supabase-js'
import type { SquadReadRepository } from '@/lib/application/read-repositories'
import type { SquadReadModel, SquadPlayerReadModel } from '@/lib/application/read-models'
import type { PlayerAssetStatus, PlayerContract, PlayerMaster, UniversePlayer, UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse } from './mappers'

const num = (value: unknown) => Number(value ?? 0)

function mapMaster(row: any): PlayerMaster {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.external_id,
    providerVersion: row.provider_version ?? null,
    name: row.name,
    position: row.position,
    overall: num(row.overall),
    nationality: row.nationality ?? null,
    imageUrl: row.image_url ?? null,
    attributes: row.attributes ?? {},
    popularityIndex: row.popularity_index == null ? null : num(row.popularity_index),
    updatedAt: row.updated_at,
  }
}

function mapAsset(row: any): UniversePlayer {
  return {
    id: row.id,
    universeId: row.universe_id,
    playerId: row.player_id,
    ownerClubId: row.owner_club_id ?? null,
    status: row.status as PlayerAssetStatus,
    platformPrice: num(row.platform_price),
    marketReferenceValue: num(row.market_reference_value),
    salaryReference: num(row.salary_reference),
    acquiredAt: row.acquired_at ?? null,
    updatedAt: row.updated_at,
  }
}

function mapContract(row: any): PlayerContract {
  return {
    id: row.id,
    universePlayerId: row.universe_player_id,
    clubId: row.club_id,
    salary: num(row.salary),
    startSeasonId: row.start_season_id ?? null,
    endSeasonId: row.end_season_id ?? null,
    status: row.status,
    clauses: row.clauses ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class SupabaseSquadReadRepository implements SquadReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<SquadReadModel | null> {
    const [universeQ, clubQ] = await Promise.all([
      this.client.from('universe').select('*').eq('id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id', userId).eq('universe_id', universeId).maybeSingle(),
    ])
    if (universeQ.error) throw universeQ.error
    if (clubQ.error) throw clubQ.error
    if (!universeQ.data || !clubQ.data) return null

    const club = mapClub(clubQ.data)
    const assetsQ = await this.client.from('universe_player').select('*').eq('owner_club_id', club.id).order('updated_at', { ascending: false })
    if (assetsQ.error) throw assetsQ.error
    const assets = (assetsQ.data ?? []).map(mapAsset)

    if (assets.length === 0) {
      return {
        universe: mapUniverse(universeQ.data),
        club,
        players: [],
        totals: { squadSize: 0, active: 0, reserve: 0, unavailable: 0, listed: 0, auction: 0, contractPayroll: 0, salaryReference: 0, marketReferenceValue: 0 },
      }
    }

    const playerIds = [...new Set(assets.map(asset => asset.playerId))]
    const assetIds = assets.map(asset => asset.id)
    const [mastersQ, contractsQ] = await Promise.all([
      this.client.from('player_master').select('*').in('id', playerIds),
      this.client.from('player_contract').select('*').in('universe_player_id', assetIds).eq('club_id', club.id).eq('status', 'ACTIVE'),
    ])
    if (mastersQ.error) throw mastersQ.error
    if (contractsQ.error) throw contractsQ.error

    const masters = new Map((mastersQ.data ?? []).map((row: any) => [row.id as UUID, mapMaster(row)]))
    const contracts = new Map((contractsQ.data ?? []).map((row: any) => [row.universe_player_id as UUID, mapContract(row)]))
    const players: SquadPlayerReadModel[] = assets.flatMap(asset => {
      const player = masters.get(asset.playerId)
      return player ? [{ asset, player, activeContract: contracts.get(asset.id) ?? null }] : []
    }).sort((a, b) => b.player.overall - a.player.overall || a.player.name.localeCompare(b.player.name))

    const count = (status: PlayerAssetStatus) => players.filter(entry => entry.asset.status === status).length
    return {
      universe: mapUniverse(universeQ.data),
      club,
      players,
      totals: {
        squadSize: players.length,
        active: count('ACTIVE'),
        reserve: count('RESERVE'),
        unavailable: count('UNAVAILABLE'),
        listed: count('LISTED'),
        auction: count('AUCTION'),
        contractPayroll: players.reduce((sum, entry) => sum + (entry.activeContract?.salary ?? 0), 0),
        salaryReference: players.reduce((sum, entry) => sum + entry.asset.salaryReference, 0),
        marketReferenceValue: players.reduce((sum, entry) => sum + entry.asset.marketReferenceValue, 0),
      },
    }
  }
}
