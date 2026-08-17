import type { SupabaseClient } from '@supabase/supabase-js'
import type { CompetitionHubReadRepository } from '@/lib/application/read-repositories'
import type { CompetitionHubReadModel, MatchContextReadModel } from '@/lib/application/read-models'
import type { Competition, Match, UUID } from '@/lib/domain/core'
import { mapClub, mapUniverse } from './mappers'

const num = (value: unknown) => Number(value ?? 0)
const mapCompetition = (row: any): Competition => ({ id: row.id, universeId: row.universe_id, seasonId: row.season_id ?? null, type: row.type, name: row.name, status: row.status, rules: row.rules ?? {}, entryFee: num(row.entry_fee), prizePool: num(row.prize_pool), createdAt: row.created_at })
const mapMatch = (row: any): Match => ({ id: row.id, universeId: row.universe_id, competitionId: row.competition_id ?? null, homeClubId: row.home_club_id, awayClubId: row.away_club_id, state: row.state, scheduledAt: row.scheduled_at ?? null, homeScore: row.home_score == null ? null : num(row.home_score), awayScore: row.away_score == null ? null : num(row.away_score), submittedBy: row.submitted_by ?? null, submittedAt: row.submitted_at ?? null, confirmedAt: row.confirmed_at ?? null, settledAt: row.settled_at ?? null, resultMetadata: row.result_metadata ?? {}, createdAt: row.created_at, updatedAt: row.updated_at })

export class SupabaseCompetitionHubReadRepository implements CompetitionHubReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: UUID, universeId: UUID): Promise<CompetitionHubReadModel | null> {
    const [universeQ, clubQ] = await Promise.all([
      this.client.from('universe').select('*').eq('id', universeId).maybeSingle(),
      this.client.from('club').select('*').eq('user_id', userId).eq('universe_id', universeId).maybeSingle(),
    ])
    if (universeQ.error) throw universeQ.error
    if (clubQ.error) throw clubQ.error
    if (!universeQ.data || !clubQ.data) return null
    const club = mapClub(clubQ.data)

    const [matchesQ, competitionsQ, silverQ] = await Promise.all([
      this.client.from('match').select('*').eq('universe_id', universeId).or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`).order('scheduled_at', { ascending: false }).limit(50),
      this.client.from('competition').select('*').eq('universe_id', universeId).not('status', 'in', '(CANCELLED,ARCHIVED)').order('created_at', { ascending: false }),
      this.client.from('club_currency_account').select('balance').eq('club_id', club.id).eq('currency', 'SILVER').maybeSingle(),
    ])
    if (matchesQ.error) throw matchesQ.error
    if (competitionsQ.error) throw competitionsQ.error
    if (silverQ.error) throw silverQ.error

    const matches = (matchesQ.data ?? []).map(mapMatch)
    const clubIds = [...new Set(matches.flatMap(match => [match.homeClubId, match.awayClubId]))]
    const clubsQ = clubIds.length ? await this.client.from('club').select('*').in('id', clubIds) : { data: [], error: null }
    if (clubsQ.error) throw clubsQ.error
    const clubs = new Map((clubsQ.data ?? []).map((row: any) => [row.id as UUID, mapClub(row)]))
    const competitions = (competitionsQ.data ?? []).map(mapCompetition)
    const competitionMap = new Map(competitions.map(competition => [competition.id, competition]))

    const contexts: MatchContextReadModel[] = matches.flatMap(match => {
      const homeClub = clubs.get(match.homeClubId); const awayClub = clubs.get(match.awayClubId)
      if (!homeClub || !awayClub) return []
      return [{ match, homeClub, awayClub, competition: match.competitionId ? competitionMap.get(match.competitionId) ?? null : null, isHome: match.homeClubId === club.id, canSubmit: ['READY','PLAYED'].includes(match.state), canConfirm: match.state === 'RESULT_SUBMITTED' && match.submittedBy !== userId, canDispute: ['RESULT_SUBMITTED','CONFIRMED','DISPUTED'].includes(match.state) }]
    })

    return { universe: mapUniverse(universeQ.data), club, silverBalance: num(silverQ.data?.balance), competitions, activeMatches: contexts.filter(context => !['SETTLED','CANCELLED'].includes(context.match.state)), completedMatches: contexts.filter(context => ['SETTLED','CANCELLED'].includes(context.match.state)) }
  }
}
