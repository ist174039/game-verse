export type DomainErrorCode =
  | 'authentication_required'
  | 'universe_not_found'
  | 'universe_not_joinable'
  | 'universe_not_accepting_clubs'
  | 'universe_membership_required'
  | 'club_already_exists_in_universe'
  | 'club_name_too_short'
  | 'amount_must_be_positive_integer'
  | 'invalid_global_currency'
  | 'invalid_club_currency'
  | 'insufficient_balance'
  | 'economic_scope_frozen'
  | 'player_not_owned_by_club'
  | 'player_not_listable'
  | 'match_not_settleable'
  | 'match_requires_distinct_clubs'
  | 'idempotency_key_required'

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message = code) {
    super(message)
    this.name = 'DomainError'
  }
}
