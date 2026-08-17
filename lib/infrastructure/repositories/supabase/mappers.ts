import type { Club, Universe, UniverseMembership, UserProfile } from '@/lib/domain/core'

type JsonRecord = Record<string, any>

export function mapUserProfile(row: JsonRecord): UserProfile {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url ?? null,
    locale: row.locale,
    managerLevel: Number(row.manager_level),
    managerXp: Number(row.manager_xp),
    reputation: Number(row.reputation),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapUniverse(row: JsonRecord): Universe {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    ownerUserId: row.owner_user_id ?? null,
    state: row.state,
    accessPolicy: row.access_policy,
    economicProfile: row.economic_profile,
    financingPolicy: row.financing_policy,
    startingSilver: Number(row.starting_silver),
    externalFinancingLimitPct: Number(row.external_financing_limit_pct),
    marketFeePct: Number(row.market_fee_pct),
    auctionFeePct: Number(row.auction_fee_pct),
    minSquadSize: Number(row.min_squad_size),
    maxSquadSize: Number(row.max_squad_size),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapUniverseMembership(row: JsonRecord): UniverseMembership {
  return {
    id: row.id,
    universeId: row.universe_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  }
}

export function mapClub(row: JsonRecord): Club {
  return {
    id: row.id,
    universeId: row.universe_id,
    userId: row.user_id,
    name: row.name,
    motto: row.motto ?? null,
    logoUrl: row.logo_url ?? null,
    prestige: Number(row.prestige),
    fans: Number(row.fans),
    elo: Number(row.elo),
    reputationScore: Number(row.reputation_score),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
