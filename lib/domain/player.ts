export type UniversePlayerStatus =
  | 'AVAILABLE'
  | 'OWNED'
  | 'LISTED'
  | 'AUCTION'
  | 'FREE_AGENT'
  | 'UNAVAILABLE'

export interface PlayerMaster {
  id: string
  provider: string
  externalId: string
  name: string
  position: string
  overall: number
  attributes: Record<string, number | string | boolean | null>
  nationality: string | null
  sourceTeam: string | null
  providerVersion: string | null
  updatedAt: string
}

export interface UniversePlayer {
  id: string
  universeId: string
  playerId: string
  ownerClubId: string | null
  status: UniversePlayerStatus
  platformPriceSilver: number
  marketReferenceValueSilver: number
  salaryReferenceSilver: number
  acquiredPriceSilver: number | null
  acquiredAt: string | null
  updatedAt: string
}

export interface PlayerContract {
  id: string
  universePlayerId: string
  clubId: string
  salarySilver: number
  startSeasonId: string
  endSeasonId: string
  status: 'ACTIVE' | 'EXPIRING' | 'ENDED' | 'TERMINATED'
}

export interface PlayerPriceFactors {
  baseQualityValue: number
  positionFactor: number
  rarityFactor: number
  demandFactor: number
  updateFactor: number
}

export function calculatePlatformPlayerPrice(factors: PlayerPriceFactors): number {
  const demandFactor = Math.min(1.25, Math.max(0.9, factors.demandFactor))
  const updateFactor = Math.min(1.3, Math.max(0.8, factors.updateFactor))
  const raw =
    factors.baseQualityValue *
    factors.positionFactor *
    factors.rarityFactor *
    demandFactor *
    updateFactor

  return Math.max(0, Math.round(raw / 10) * 10)
}
