import type { Club, Competition, Match, MarketListing, PlayerContract, PlayerMaster, Universe, UniversePlayer, UniverseRole, UserProfile, UUID } from '@/lib/domain/core'
import type { ClubLoan, FinancialCycle, SponsorshipContract } from '@/lib/domain/club-economy'
import type { CompetitionParticipant, LeagueStanding } from '@/lib/domain/competition'
import type { JournalArticle, Notification } from '@/lib/domain/communications'
import type { ClubLiability } from '@/lib/domain/operations'

export interface DashboardReadModel { user: UserProfile; universe: Universe; club: Club; currencies: { gold: number; bronze: number; silver: number }; nextMatch: Match | null; recentMatches: Match[]; standings: LeagueStanding[]; activeMarketListings: MarketListing[]; economy: { sponsorships: SponsorshipContract[]; loans: ClubLoan[]; liabilities: ClubLiability[]; latestCycle: FinancialCycle | null }; communications: { journal: JournalArticle[]; notifications: Notification[] } }
export interface UniverseOverviewReadModel { universe: Universe; club: Club | null; participantCompetitions: CompetitionParticipant[] }
export interface UniverseDirectoryEntry { universe: Universe; club: Club | null; membershipRole: UniverseRole | null }
export interface UniverseDirectoryReadModel { entries: UniverseDirectoryEntry[]; managedUniverseIds: UUID[] }
export interface SquadPlayerReadModel { asset: UniversePlayer; player: PlayerMaster; activeContract: PlayerContract | null }
export interface SquadReadModel { universe: Universe; club: Club; players: SquadPlayerReadModel[]; totals: { squadSize: number; active: number; reserve: number; unavailable: number; listed: number; auction: number; contractPayroll: number; salaryReference: number; marketReferenceValue: number } }
export interface MarketListingReadModel { listing: MarketListing; asset: UniversePlayer; player: PlayerMaster; sellerClub: Club; highestBid: number | null; bidCount: number }
export interface MarketReadModel { universe: Universe; buyerClub: Club; silverBalance: number; directListings: MarketListingReadModel[]; auctionListings: MarketListingReadModel[] }

export interface MatchContextReadModel {
  match: Match
  homeClub: Club
  awayClub: Club
  competition: Competition | null
  isHome: boolean
  canSubmit: boolean
  canConfirm: boolean
  canDispute: boolean
}
export interface CompetitionHubReadModel {
  universe: Universe
  club: Club
  silverBalance: number
  competitions: Competition[]
  activeMatches: MatchContextReadModel[]
  completedMatches: MatchContextReadModel[]
}

export interface EconomyLedgerMovementReadModel {
  entryId: UUID
  transactionId: UUID
  transactionType: string
  direction: 'DEBIT' | 'CREDIT'
  currency: 'GOLD' | 'SILVER' | 'BRONZE'
  scope: 'USER' | 'CLUB'
  amount: number
  reason: string | null
  referenceType: string | null
  referenceId: UUID | null
  createdAt: string
}
export interface EconomyReadModel {
  universe: Universe
  club: Club
  balances: { gold: number; bronze: number; silver: number }
  sponsorships: SponsorshipContract[]
  loans: ClubLoan[]
  liabilities: ClubLiability[]
  cycles: FinancialCycle[]
  movements: EconomyLedgerMovementReadModel[]
  totals: {
    activeLoanPrincipal: number
    openLiabilities: number
    activeSponsorshipPeriodicIncome: number
    latestCycleNetResult: number | null
  }
}

export interface OnboardingReadModel { userId: UUID; profileReady: boolean; availableUniverses: Universe[]; existingClubUniverseIds: UUID[]; nextStep: 'IDENTITY' | 'UNIVERSE' | 'CLUB' | 'COMPLETE' }
