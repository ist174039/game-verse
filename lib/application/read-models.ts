import type { Club, Competition, Match, MarketListing, PlayerContract, PlayerMaster, Season, Universe, UniversePlayer, UniverseRole, UserProfile, UUID } from '@/lib/domain/core'
import type { ClubLoan, FinancialCycle, SponsorshipContract } from '@/lib/domain/club-economy'
import type { CompetitionParticipant, CompetitionRound, LeagueStanding } from '@/lib/domain/competition'
import type { JournalArticle, Notification } from '@/lib/domain/communications'
import type { ClubLiability, CompetitionDivision, CompetitionRegistration, CupTie } from '@/lib/domain/operations'
import type { GoldPackage, PaymentOrder } from '@/lib/domain/payments'
import type { AdminAuditLog, ModerationCase, SupportTicket } from '@/lib/domain/governance'

export interface DashboardNextMatchReadModel { match: Match; homeClubName: string; awayClubName: string; competitionName: string | null }
export interface DashboardOperationalReadModel {
  squadSize: number
  infrastructureCount: number
  registeredCompetitions: number
  activeCompetitions: number
  availableCompetitions: number
  sponsorshipOffers: number
  activeMarketListings: number
  openLiabilities: number
  unreadNotifications: number
  settledMatches: number
}
export interface DashboardReadModel {
  user: UserProfile
  universe: Universe
  club: Club
  currencies: { gold: number; bronze: number; silver: number }
  nextMatch: Match | null
  nextMatchContext: DashboardNextMatchReadModel | null
  recentMatches: Match[]
  standings: LeagueStanding[]
  activeMarketListings: MarketListing[]
  operational: DashboardOperationalReadModel
  economy: { sponsorships: SponsorshipContract[]; loans: ClubLoan[]; liabilities: ClubLiability[]; latestCycle: FinancialCycle | null }
  communications: { journal: JournalArticle[]; notifications: Notification[] }
}
export interface UniverseOverviewReadModel { universe: Universe; club: Club | null; participantCompetitions: CompetitionParticipant[] }
export interface UniverseDirectoryEntry { universe: Universe; club: Club | null; membershipRole: UniverseRole | null }
export interface UniverseDirectoryReadModel { entries: UniverseDirectoryEntry[]; managedUniverseIds: UUID[] }
export interface SquadPlayerReadModel { asset: UniversePlayer; player: PlayerMaster; activeContract: PlayerContract | null }
export interface SquadReadModel { universe: Universe; club: Club; players: SquadPlayerReadModel[]; totals: { squadSize: number; active: number; reserve: number; unavailable: number; listed: number; auction: number; contractPayroll: number; salaryReference: number; marketReferenceValue: number } }
export interface MarketListingReadModel { listing: MarketListing; asset: UniversePlayer; player: PlayerMaster; sellerClub: Club; highestBid: number | null; bidCount: number }
export interface MarketReadModel { universe: Universe; buyerClub: Club; silverBalance: number; directListings: MarketListingReadModel[]; auctionListings: MarketListingReadModel[] }
export interface MatchContextReadModel { match: Match; homeClub: Club; awayClub: Club; competition: Competition | null; isHome: boolean; canSubmit: boolean; canConfirm: boolean; canDispute: boolean }
export interface CompetitionHubReadModel { universe: Universe; club: Club; silverBalance: number; competitions: Competition[]; activeMatches: MatchContextReadModel[]; completedMatches: MatchContextReadModel[] }
export interface CompetitionParticipantReadModel { participant: CompetitionParticipant; club: Club }
export interface CompetitionStandingReadModel { standing: LeagueStanding; club: Club }
export interface CompetitionFixtureReadModel { match: Match; homeClub: Club; awayClub: Club; roundId: UUID | null; roundNumber: number | null; roundName: string | null; leg: number; matchday: number | null }
export interface CompetitionCupTieReadModel { tie: CupTie; homeClub: Club | null; awayClub: Club | null; winnerClub: Club | null }
export interface CompetitionDetailReadModel { universe: Universe; competition: Competition; season: Season | null; viewerClub: Club | null; registration: CompetitionRegistration | null; participants: CompetitionParticipantReadModel[]; rounds: CompetitionRound[]; standings: CompetitionStandingReadModel[]; fixtures: CompetitionFixtureReadModel[]; divisions: CompetitionDivision[]; cupTies: CompetitionCupTieReadModel[] }
export interface ClubInfrastructureReadModel { id: UUID; type: 'STADIUM' | 'ACADEMY' | 'TRAINING' | 'MARKETING' | 'FINANCE'; level: number; maintenanceCost: number; updatedAt: string }
export interface ClubOverviewReadModel { universe: Universe; club: Club; silverBalance: number; infrastructure: ClubInfrastructureReadModel[]; performance: { played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; winRatePct: number } }
export interface ProfileClubReadModel { club: Club; universe: Universe }
export interface ProfileReadModel { profile: UserProfile; clubs: ProfileClubReadModel[] }
export interface RankingEntryReadModel { rank: number; club: Club; manager: Pick<UserProfile, 'id' | 'username' | 'avatarUrl'> }
export interface RankingsReadModel { universe: Universe; viewerClub: Club; viewerRank: number | null; entries: RankingEntryReadModel[] }
export interface EconomyLedgerMovementReadModel { entryId: UUID; transactionId: UUID; transactionType: string; direction: 'DEBIT' | 'CREDIT'; currency: 'GOLD' | 'SILVER' | 'BRONZE'; scope: 'USER' | 'CLUB'; amount: number; reason: string | null; referenceType: string | null; referenceId: UUID | null; createdAt: string }
export interface EconomyReadModel { universe: Universe; club: Club; balances: { gold: number; bronze: number; silver: number }; sponsorships: SponsorshipContract[]; loans: ClubLoan[]; liabilities: ClubLiability[]; cycles: FinancialCycle[]; movements: EconomyLedgerMovementReadModel[]; totals: { activeLoanPrincipal: number; openLiabilities: number; activeSponsorshipPeriodicIncome: number; latestCycleNetResult: number | null } }
export interface GoldCatalogReadModel { balance: number; packages: GoldPackage[]; recentOrders: PaymentOrder[] }
export interface OnboardingReadModel { userId: UUID; profileReady: boolean; availableUniverses: Universe[]; existingClubUniverseIds: UUID[]; nextStep: 'IDENTITY' | 'UNIVERSE' | 'CLUB' | 'COMPLETE' }

export interface AdminRecentUserReadModel { id: UUID; username: string; managerLevel: number; reputation: number; createdAt: string }
export interface AdminUniverseReadModel { id: UUID; name: string; kind: string; state: string; accessPolicy: string; economicProfile: string; financingPolicy: string; createdAt: string }
export interface AdminPaymentOrderReadModel { id: UUID; userId: UUID; status: string; amountCents: number; currency: string; goldAmount: number; refundedCents: number; createdAt: string }
export interface AdminFeatureFlagReadModel { key: string; enabled: boolean; scope: string; scopeReference: string | null; updatedAt: string }
export interface AdminConfigReadModel { key: string; category: string; version: number; effectiveFrom: string; updatedAt: string }
export interface AdminPlatformOverviewReadModel {
  metrics: {
    users: number; clubs: number; universes: number; activeUniverses: number; competitions: number; unsettledMatches: number;
    activeListings: number; openTickets: number; criticalTickets: number; openModerationCases: number; activeFreezes: number;
    pendingPayments: number; refundQueue: number; enabledFeatureFlags: number; totalFeatureFlags: number;
  }
  recentUsers: AdminRecentUserReadModel[]
  universes: AdminUniverseReadModel[]
  payments: AdminPaymentOrderReadModel[]
  tickets: SupportTicket[]
  moderationCases: ModerationCase[]
  featureFlags: AdminFeatureFlagReadModel[]
  configs: AdminConfigReadModel[]
  auditLog: AdminAuditLog[]
}
