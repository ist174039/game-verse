// LEGACY COMPATIBILITY LAYER
// New Clã das Sombras code must import domain types from '@/lib/domain/*'.
// This file exists only while legacy pages are migrated and must not receive new business rules.

export * from '@/lib/domain/core'
export * from '@/lib/domain/economy'

/** @deprecated Legacy GameVerse wallet. Remove when all legacy pages are migrated. */
export interface Wallet {
  id: string
  user_id: string
  balance: number
  infrastructure_credit: number
  updated_at: string
}

/** @deprecated Legacy transaction model. Use ledger_transaction + ledger_entry. */
export interface CoinTransaction {
  id: string
  user_id: string
  wallet_id: string
  type: 'credit' | 'debit'
  amount: number
  source_type: string
  source_id: string | null
  description: string | null
  balance_before: number
  balance_after: number
  created_at: string
}

/** @deprecated Legacy fiat package. Use gold_package. */
export interface CoinPackage {
  id: string
  name: string
  slug: string
  coins_amount: number
  price_cents: number
  bonus_percentage: number
  active: boolean
  created_at: string
}

/** @deprecated Legacy fiat transaction. Use payment_order. */
export interface FiatTransaction {
  id: string
  user_id: string
  package_id: string | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount_cents: number
  coins_granted: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
}

/** @deprecated Legacy UI compatibility. */
export interface LegacyUserProfile {
  id: string
  username: string
  email: string
  avatar_url: string | null
  is_new_user: boolean
  games_played_valid: number
  prestige_level: number
  elo_rating: number
  locale: string
  created_at: string
  updated_at: string
}

/** @deprecated Legacy UI compatibility. */
export interface LegacyClub {
  id: string
  user_id: string
  name: string
  motto: string | null
  logo_url: string | null
  prestige_score: number
  total_games: number
  wins: number
  draws: number
  losses: number
  created_at: string
  updated_at: string
}

/** @deprecated Legacy market listing. Use domain MarketListing. */
export interface MarketListingWithSeller {
  id: string
  seller_id: string
  card_name: string
  card_rarity: 'common' | 'rare' | 'epic' | 'legendary'
  card_type: string | null
  description: string | null
  price: number
  status: 'active' | 'sold' | 'cancelled'
  image_url: string | null
  created_at: string
  updated_at: string
  seller?: Pick<LegacyUserProfile, 'id' | 'username' | 'avatar_url'>
}

/** @deprecated Legacy competition UI compatibility. */
export interface Tournament {
  id: string
  name: string
  description: string | null
  creator_id: string
  format: 'knockout' | 'round_robin' | 'swiss'
  entry_fee: number
  max_participants: number
  current_participants: number
  prize_pool: number
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled'
  starts_at: string
  created_at: string
  updated_at: string
}

/** @deprecated Legacy match UI compatibility. */
export interface LegacyMatch {
  id: string
  creator_id: string
  opponent_id: string | null
  match_type: 'casual' | 'ranked' | 'tournament'
  state: string
  creator_score: number | null
  opponent_score: number | null
  screenshot_url: string | null
  winner_id: string | null
  tournament_id: string | null
  created_at: string
  updated_at: string
}

/** @deprecated Legacy social compatibility. */
export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

/** @deprecated Legacy social compatibility. */
export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string | null
  channel: 'direct' | 'community' | 'tournament'
  channel_id: string | null
  content: string
  created_at: string
}
