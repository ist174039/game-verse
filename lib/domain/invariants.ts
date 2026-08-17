import type { Match, Universe, UniversePlayer } from './core'

export function canJoinUniverse(universe: Universe): boolean {
  return universe.accessPolicy === 'PUBLIC' && ['OPEN_FOR_MEMBERS', 'ACTIVE', 'SEASON_CLOSED'].includes(universe.state)
}

export function canCreateClub(universe: Universe): boolean {
  return ['OPEN_FOR_MEMBERS', 'ACTIVE', 'SEASON_CLOSED'].includes(universe.state)
}

export function assertDistinctMatchClubs(homeClubId: string, awayClubId: string): void {
  if (homeClubId === awayClubId) throw new Error('match_requires_distinct_clubs')
}

export function canSubmitMatchResult(match: Match): boolean {
  return ['READY', 'PLAYED', 'RESULT_SUBMITTED'].includes(match.state)
}

export function canSettleMatch(match: Match): boolean {
  return ['CONFIRMED', 'AUTO_CONFIRMED'].includes(match.state) && match.settledAt === null
}

export function canListPlayer(player: UniversePlayer, clubId: string): boolean {
  return player.ownerClubId === clubId && ['OWNED', 'ACTIVE', 'RESERVE'].includes(player.status)
}

export function assertExternalRatingsOnly(): never {
  throw new Error('player_attributes_are_external_source_only')
}
