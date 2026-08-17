import type { Club, Match, Universe, UserProfile, UUID } from '@/lib/domain/core'
import type { ClubLoan, FinancialCycle, SponsorshipContract } from '@/lib/domain/club-economy'
import type { CompetitionParticipant, LeagueStanding } from '@/lib/domain/competition'
import type { JournalArticle, Notification } from '@/lib/domain/communications'
import type { ClubLiability } from '@/lib/domain/operations'
import type { MarketListing } from '@/lib/domain/core'

/**
 * Stable projection consumed by the authenticated dashboard.
 * It deliberately contains presentation-ready domain data, never Supabase row shapes.
 */
export interface DashboardReadModel {
  user: UserProfile
  universe: Universe
  club: Club
  currencies: {
    gold: number
    bronze: number
    silver: number
  }
  nextMatch: Match | null
  recentMatches: Match[]
  standings: LeagueStanding[]
  activeMarketListings: MarketListing[]
  economy: {
    sponsorships: SponsorshipContract[]
    loans: ClubLoan[]
    liabilities: ClubLiability[]
    latestCycle: FinancialCycle | null
  }
  communications: {
    journal: JournalArticle[]
    notifications: Notification[]
  }
}

export interface UniverseOverviewReadModel {
  universe: Universe
  club: Club | null
  participantCompetitions: CompetitionParticipant[]
}

export interface OnboardingReadModel {
  userId: UUID
  profileReady: boolean
  availableUniverses: Universe[]
  existingClubUniverseIds: UUID[]
  nextStep: 'IDENTITY' | 'UNIVERSE' | 'CLUB' | 'COMPLETE'
}
