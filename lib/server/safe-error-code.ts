/** Return only a stable, explicitly reviewed error code to an API caller. */
export function allowlistedErrorCode(error: unknown, allowed: readonly string[], fallback: string) {
  const message = error instanceof Error ? error.message : ''
  const code = message.trim()
  return allowed.includes(code) ? code : fallback
}

export const MARKET_ERROR_CODES = [
  'auction_not_open', 'auction_not_settleable', 'auction_still_open', 'auction_with_bids_cannot_be_cancelled',
  'auction_without_bids', 'bid_too_low', 'bidder_club_or_universe_not_found', 'buy_now_below_starting_price',
  'buyer_club_or_universe_not_found', 'buyer_club_required', 'buyer_economic_scope_frozen', 'buyer_silver_account_not_found',
  'cannot_buy_own_player', 'economic_scope_frozen', 'idempotency_key_conflict', 'idempotency_key_required',
  'insufficient_silver', 'invalid_asking_price', 'invalid_auction_terms', 'invalid_bidder', 'invalid_platform_price',
  'listing_not_available', 'listing_not_found', 'not_listing_owner', 'not_player_owner', 'player_already_listed',
  'player_locked_in_pending_lineup', 'player_not_owned', 'seller_economic_scope_frozen', 'seller_silver_account_not_found',
  'universe_not_found', 'universe_player_not_found',
] as const

export const COMPETITION_ERROR_CODES = [
  'authentication_required', 'club_required_in_universe', 'competition_not_found', 'cup_match_missing', 'cup_tie_not_found',
  'cup_tie_requires_winner', 'division_not_found', 'idempotency_key_conflict', 'idempotency_key_required', 'invalid_score',
  'league_required', 'season_required', 'registration_closed', 'match_not_found',
  'not_match_participant', 'match_not_submittable', 'result_not_awaiting_confirmation', 'opponent_confirmation_required',
  'match_not_disputable', 'dispute_already_open', 'dispute_not_found', 'match_already_settled',
] as const
