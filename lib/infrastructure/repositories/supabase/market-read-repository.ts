import type { SupabaseClient } from '@supabase/supabase-js'
import type { MarketReadRepository } from '@/lib/application/read-repositories'
import type { MarketListingReadModel, MarketReadModel } from '@/lib/application/read-models'
import type { MarketListing, PlayerAssetStatus, PlayerMaster, UniversePlayer, UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse } from './mappers'

const num = (value: unknown) => Number(value ?? 0)

function mapListing(row: any): MarketListing {
  return { id: row.id, universeId: row.universe_id, universePlayerId: row.universe_player_id, sellerClubId: row.seller_club_id, listingType: row.listing_type, status: row.status, askingPrice: row.asking_price == null ? null : num(row.asking_price), startsAt: row.starts_at, endsAt: row.ends_at ?? null, buyNowPrice: row.buy_now_price == null ? null : num(row.buy_now_price), createdAt: row.created_at, updatedAt: row.updated_at }
}
function mapAsset(row: any): UniversePlayer {
  return { id: row.id, universeId: row.universe_id, playerId: row.player_id, ownerClubId: row.owner_club_id ?? null, status: row.status as PlayerAssetStatus, platformPrice: num(row.platform_price), marketReferenceValue: num(row.market_reference_value), salaryReference: num(row.salary_reference), acquiredAt: row.acquired_at ?? null, updatedAt: row.updated_at }
}
function mapMaster(row: any): PlayerMaster {
  return { id: row.id, provider: row.provider, externalId: row.external_id, providerVersion: row.provider_version ?? null, name: row.name, position: row.position, overall: num(row.overall), nationality: row.nationality ?? null, imageUrl: row.image_url ?? null, attributes: row.attributes ?? {}, popularityIndex: row.popularity_index == null ? null : num(row.popularity_index), updatedAt: row.updated_at }
}

export class SupabaseMarketReadRepository implements MarketReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<MarketReadModel | null> {
    const [universeQ, clubQ] = await Promise.all([
      this.client.from('universe').select('*').eq('id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id', userId).eq('universe_id', universeId).maybeSingle(),
    ])
    if (universeQ.error) throw universeQ.error
    if (clubQ.error) throw clubQ.error
    if (!universeQ.data || !clubQ.data) return null
    const buyerClub = mapClub(clubQ.data)

    const [listingsQ, silverQ] = await Promise.all([
      this.client.from('market_listing').select('*').eq('universe_id', universeId).eq('status', 'ACTIVE').order('created_at', { ascending: false }),
      this.client.from('club_currency_account').select('balance').eq('club_id', buyerClub.id).eq('currency', 'SILVER').maybeSingle(),
    ])
    if (listingsQ.error) throw listingsQ.error
    if (silverQ.error) throw silverQ.error
    const listings = (listingsQ.data ?? []).map(mapListing)
    if (listings.length === 0) return { universe: mapUniverse(universeQ.data), buyerClub, silverBalance: num(silverQ.data?.balance), directListings: [], auctionListings: [] }

    const assetIds = [...new Set(listings.map(listing => listing.universePlayerId))]
    const sellerIds = [...new Set(listings.map(listing => listing.sellerClubId))]
    const [assetsQ, sellersQ, bidsQ] = await Promise.all([
      this.client.from('universe_player').select('*').in('id', assetIds),
      this.client.from('club').select('*').in('id', sellerIds),
      this.client.from('auction_bid').select('listing_id,amount').in('listing_id', listings.map(listing => listing.id)),
    ])
    if (assetsQ.error) throw assetsQ.error
    if (sellersQ.error) throw sellersQ.error
    if (bidsQ.error) throw bidsQ.error
    const assets = new Map((assetsQ.data ?? []).map((row: any) => [row.id as UUID, mapAsset(row)]))
    const playerIds = [...new Set([...assets.values()].map(asset => asset.playerId))]
    const mastersQ = await this.client.from('player_master').select('*').in('id', playerIds)
    if (mastersQ.error) throw mastersQ.error
    const masters = new Map((mastersQ.data ?? []).map((row: any) => [row.id as UUID, mapMaster(row)]))
    const sellers = new Map((sellersQ.data ?? []).map((row: any) => [row.id as UUID, mapClub(row)]))
    const bidStats = new Map<UUID, { highestBid: number; bidCount: number }>()
    for (const row of bidsQ.data ?? []) {
      const current = bidStats.get(row.listing_id) ?? { highestBid: 0, bidCount: 0 }
      current.highestBid = Math.max(current.highestBid, num(row.amount)); current.bidCount += 1; bidStats.set(row.listing_id, current)
    }

    const entries: MarketListingReadModel[] = listings.flatMap(listing => {
      const asset = assets.get(listing.universePlayerId); const sellerClub = sellers.get(listing.sellerClubId); const player = asset ? masters.get(asset.playerId) : null
      if (!asset || !sellerClub || !player) return []
      const stats = bidStats.get(listing.id)
      return [{ listing, asset, player, sellerClub, highestBid: stats?.highestBid || null, bidCount: stats?.bidCount ?? 0 }]
    })

    return {
      universe: mapUniverse(universeQ.data), buyerClub, silverBalance: num(silverQ.data?.balance),
      directListings: entries.filter(entry => entry.listing.listingType === 'DIRECT'),
      auctionListings: entries.filter(entry => entry.listing.listingType === 'AUCTION'),
    }
  }
}
