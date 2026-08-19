import type { SupabaseClient } from '@supabase/supabase-js'
import type { MarketRepository, PlayerRepository } from '@/lib/application/contracts'
import type { MarketListing, PlayerMaster, UniversePlayer, UUID } from '@/lib/domain/core'
import type { AuctionBid, PlayerProviderSnapshot, TransferReceipt, UniversePlayerValuation } from '@/lib/domain/player-market'

const num = (value: unknown) => Number(value ?? 0)

function mapPlayerMaster(row: any): PlayerMaster {
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

function mapUniversePlayer(row: any): UniversePlayer {
  return {
    id: row.id,
    universeId: row.universe_id,
    playerId: row.player_id,
    ownerClubId: row.owner_club_id ?? null,
    status: row.status,
    platformPrice: num(row.platform_price),
    marketReferenceValue: num(row.market_reference_value),
    salaryReference: num(row.salary_reference),
    acquiredAt: row.acquired_at ?? null,
    updatedAt: row.updated_at,
  }
}

function mapListing(row: any): MarketListing {
  return {
    id: row.id,
    universeId: row.universe_id,
    universePlayerId: row.universe_player_id,
    sellerClubId: row.seller_club_id,
    listingType: row.listing_type,
    status: row.status,
    askingPrice: row.asking_price == null ? null : num(row.asking_price),
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? null,
    buyNowPrice: row.buy_now_price == null ? null : num(row.buy_now_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class SupabasePlayerRepository implements PlayerRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getMaster(id: UUID): Promise<PlayerMaster | null> {
    const { data, error } = await this.client.from('player_master').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapPlayerMaster(data) : null
  }

  async getUniversePlayer(id: UUID): Promise<UniversePlayer | null> {
    const { data, error } = await this.client.from('universe_player').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapUniversePlayer(data) : null
  }

  async listClubSquad(clubId: UUID): Promise<UniversePlayer[]> {
    const { data, error } = await this.client.from('universe_player').select('*').eq('owner_club_id', clubId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapUniversePlayer)
  }

  async listProviderSnapshots(playerId: UUID): Promise<PlayerProviderSnapshot[]> {
    const { data, error } = await this.client.from('player_provider_snapshot').select('*').eq('player_id', playerId).order('captured_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) => ({ id: row.id, playerId: row.player_id, provider: row.provider, externalId: row.external_id, providerVersion: row.provider_version ?? null, overall: num(row.overall), attributes: row.attributes ?? {}, sourcePayload: row.source_payload ?? {}, capturedAt: row.captured_at }))
  }

  async listValuations(universePlayerId: UUID): Promise<UniversePlayerValuation[]> {
    const { data, error } = await this.client.from('universe_player_valuation').select('*').eq('universe_player_id', universePlayerId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) => ({ id: row.id, universePlayerId: row.universe_player_id, overall: num(row.overall), platformPrice: num(row.platform_price), marketReferenceValue: num(row.market_reference_value), salaryReference: num(row.salary_reference), reason: row.reason, createdAt: row.created_at }))
  }
}

export class SupabaseMarketRepository implements MarketRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getListing(id: UUID): Promise<MarketListing | null> {
    const { data, error } = await this.client.from('market_listing').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapListing(data) : null
  }

  async listActive(universeId: UUID): Promise<MarketListing[]> {
    const { data, error } = await this.client.from('market_listing').select('*').eq('universe_id', universeId).eq('status', 'ACTIVE').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapListing)
  }

  async listBids(listingId: UUID): Promise<AuctionBid[]> {
    const { data, error } = await this.client.from('auction_bid').select('*').eq('listing_id', listingId).order('amount', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) => ({ id: row.id, listingId: row.listing_id, bidderClubId: row.bidder_club_id, amount: num(row.amount), createdAt: row.created_at }))
  }

  async createDirectListing(input: { universePlayerId: UUID; askingPrice: number; idempotencyKey: string }): Promise<MarketListing> {
    const { data, error } = await this.client.rpc('create_direct_market_listing', { p_universe_player_id: input.universePlayerId, p_asking_price: input.askingPrice, p_idempotency_key: input.idempotencyKey })
    if (error) throw error
    return mapListing(data)
  }

  async createAuctionListing(input: { universePlayerId: UUID; startingPrice: number; buyNowPrice?: number | null; endsAt: string; idempotencyKey: string }): Promise<MarketListing> {
    const { data, error } = await this.client.rpc('create_auction_listing', {
      p_universe_player_id: input.universePlayerId,
      p_starting_price: input.startingPrice,
      p_buy_now_price: input.buyNowPrice ?? null,
      p_ends_at: input.endsAt,
      p_idempotency_key: input.idempotencyKey,
    })
    if (error) throw error
    return mapListing(data)
  }

  async buyDirectListing(input: { listingId: UUID; idempotencyKey: string }): Promise<TransferReceipt> {
    const { data, error } = await this.client.rpc('buy_direct_market_listing', { p_listing_id: input.listingId, p_idempotency_key: input.idempotencyKey })
    if (error) throw error
    return data as TransferReceipt
  }

  async placeAuctionBid(input: { listingId: UUID; amount: number; idempotencyKey: string }): Promise<AuctionBid> {
    const { data, error } = await this.client.rpc('place_auction_bid', { p_listing_id: input.listingId, p_amount: input.amount, p_idempotency_key: input.idempotencyKey })
    if (error) throw error
    return { id: data.id, listingId: data.listing_id, bidderClubId: data.bidder_club_id, amount: num(data.amount), createdAt: data.created_at }
  }

  async settleAuction(input: { listingId: UUID; idempotencyKey: string }): Promise<TransferReceipt> {
    const { data, error } = await this.client.rpc('settle_auction', { p_listing_id: input.listingId, p_idempotency_key: input.idempotencyKey })
    if (error) throw error
    return data as TransferReceipt
  }

  async cancelListing(input: { listingId: UUID; idempotencyKey: string }): Promise<void> {
    const { error } = await this.client.rpc('cancel_market_listing', { p_listing_id: input.listingId, p_idempotency_key: input.idempotencyKey })
    if (error) throw error
  }
}
