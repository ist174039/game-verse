import type { Club, Competition, Match, MarketListing, PlayerMaster, Season, Universe, UniverseMembership, UniversePlayer, UserProfile, UUID } from '@/lib/domain/core'
import type { LedgerTransaction } from '@/lib/domain/economy'
import type { AuctionBid, PlayerProviderSnapshot, TransferReceipt, UniversePlayerValuation } from '@/lib/domain/player-market'
import type { CompetitionParticipant, LeagueStanding, MatchDispute, MatchSettlementReceipt } from '@/lib/domain/competition'
import type { ClubLoan, FinancialCycle, GoldToSilverFinancingReceipt, InfrastructureType, InfrastructureUpgradeReceipt, LoanRepaymentReceipt, SponsorshipContract } from '@/lib/domain/club-economy'
import type { AchievementDefinition, BronzeStoreItem, DailyRewardClaim, MissionDefinition, UserAchievement, UserMission } from '@/lib/domain/retention'
import type { JournalArticle, Notification } from '@/lib/domain/communications'
import type { AdminAuditLog, CaseStatus, EconomicFreeze, FeatureFlag, FreezeScope, ModerationCase, PlatformConfig, SupportTicket, TicketNote, TicketStatus } from '@/lib/domain/governance'
import type { ChatMessage, Community, CommunityConversation, CommunityMembership, CommunityPost, CommunityVisibility, DirectConversation } from '@/lib/domain/social'
import type { ClubLiability, CompetitionRegistration, MatchFinancialEvent } from '@/lib/domain/operations'

export interface IdentityRepository { getProfile(userId: UUID): Promise<UserProfile | null>; ensureProfile(userId: UUID, input: { username: string; locale?: string }): Promise<UserProfile> }
export interface UniverseRepository { getById(id: UUID): Promise<Universe | null>; listAvailable(userId: UUID): Promise<Universe[]>; joinPublic(universeId: UUID): Promise<UniverseMembership>; createClub(input: { universeId: UUID; name: string; motto?: string | null; logoUrl?: string | null; idempotencyKey: string }): Promise<Club> }
export interface ClubRepository { getById(id: UUID): Promise<Club | null>; getForUserInUniverse(userId: UUID, universeId: UUID): Promise<Club | null>; upgradeInfrastructure(input: { clubId: UUID; infrastructureType: InfrastructureType; idempotencyKey: string }): Promise<InfrastructureUpgradeReceipt> }
export interface PlayerRepository { getMaster(id: UUID): Promise<PlayerMaster | null>; getUniversePlayer(id: UUID): Promise<UniversePlayer | null>; listClubSquad(clubId: UUID): Promise<UniversePlayer[]>; listProviderSnapshots(playerId: UUID): Promise<PlayerProviderSnapshot[]>; listValuations(universePlayerId: UUID): Promise<UniversePlayerValuation[]> }
export interface CompetitionRepository { getSeason(id: UUID): Promise<Season | null>; getCompetition(id: UUID): Promise<Competition | null>; getMatch(id: UUID): Promise<Match | null>; listParticipants(competitionId: UUID): Promise<CompetitionParticipant[]>; listStandings(competitionId: UUID): Promise<LeagueStanding[]>; listClubMatches(clubId: UUID): Promise<Match[]>; register(input: { competitionId: UUID; idempotencyKey: string }): Promise<CompetitionRegistration>; submitResult(input: { matchId: UUID; homeScore: number; awayScore: number; idempotencyKey: string }): Promise<Match>; confirmResult(input: { matchId: UUID; idempotencyKey: string }): Promise<MatchSettlementReceipt>; openDispute(input: { matchId: UUID; reason: string }): Promise<MatchDispute> }
export interface MarketRepository { getListing(id: UUID): Promise<MarketListing | null>; listActive(universeId: UUID): Promise<MarketListing[]>; listBids(listingId: UUID): Promise<AuctionBid[]>; createDirectListing(input: { universePlayerId: UUID; askingPrice: number; idempotencyKey: string }): Promise<MarketListing>; buyDirectListing(input: { listingId: UUID; idempotencyKey: string }): Promise<TransferReceipt>; placeAuctionBid(input: { listingId: UUID; amount: number; idempotencyKey: string }): Promise<AuctionBid>; settleAuction(input: { listingId: UUID; idempotencyKey: string }): Promise<TransferReceipt>; cancelListing(input: { listingId: UUID; idempotencyKey: string }): Promise<void> }
export interface LedgerRepository { getTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null> }
export interface ClubEconomyRepository { listSponsorships(clubId: UUID): Promise<SponsorshipContract[]>; listLoans(clubId: UUID): Promise<ClubLoan[]>; listFinancialCycles(clubId: UUID): Promise<FinancialCycle[]>; financeWithGold(input: { clubId: UUID; goldAmount: number; idempotencyKey: string }): Promise<GoldToSilverFinancingReceipt>; originateLoan(input: { clubId: UUID; principal: number; idempotencyKey: string }): Promise<ClubLoan>; repayLoanInstallment(input: { loanId: UUID; idempotencyKey: string }): Promise<LoanRepaymentReceipt> }
export interface RetentionRepository { listActiveMissions(userId: UUID): Promise<Array<{ definition: MissionDefinition; progress: UserMission | null }>>; claimDailyReward(): Promise<DailyRewardClaim>; listAchievements(userId: UUID): Promise<Array<{ definition: AchievementDefinition; unlocked: UserAchievement | null }>>; listBronzeStore(): Promise<BronzeStoreItem[]> }
export interface CommunicationRepository { listJournal(universeId: UUID, limit?: number): Promise<JournalArticle[]>; listNotifications(userId: UUID, limit?: number): Promise<Notification[]>; markNotificationRead(notificationId: UUID): Promise<void> }
export interface SocialRepository {
  listCommunities(userId:UUID):Promise<Community[]>
  listCommunityPosts(communityId:UUID,limit?:number):Promise<CommunityPost[]>
  listConversations(userId:UUID):Promise<DirectConversation[]>
  listCommunityConversations(userId:UUID):Promise<CommunityConversation[]>
  listMessages(conversationId:UUID,limit?:number):Promise<ChatMessage[]>
  createCommunity(input:{name:string;slug:string;description?:string|null;visibility:CommunityVisibility}):Promise<Community>
  joinCommunity(communityId:UUID):Promise<CommunityMembership>
  createPost(input:{communityId:UUID;body:string}):Promise<CommunityPost>
  startDirectConversation(otherUserId:UUID):Promise<{id:UUID;createdAt:string}>
  sendMessage(input:{conversationId:UUID;body:string}):Promise<ChatMessage>
}
export interface GovernanceRepository {
  listTickets(limit?: number): Promise<SupportTicket[]>
  listModerationCases(limit?: number): Promise<ModerationCase[]>
  listAuditLog(limit?: number): Promise<AdminAuditLog[]>
  updateTicket(input: { ticketId: UUID; status: TicketStatus; assignedAdminId: UUID | null; actorUserId: UUID; reason: string }): Promise<SupportTicket>
  addTicketNote(input: { ticketId: UUID; body: string; internal: boolean; actorUserId: UUID }): Promise<TicketNote>
  updateModerationCase(input: { caseId: UUID; status: CaseStatus; assignedAdminId: UUID | null; resolution: Record<string, unknown> | null; actorUserId: UUID; reason: string }): Promise<ModerationCase>
  createEconomicFreeze(input: { scope: FreezeScope; targetId: UUID; reason: string; caseId: UUID | null; actorUserId: UUID }): Promise<EconomicFreeze>
  releaseEconomicFreeze(input: { freezeId: UUID; actorUserId: UUID; reason: string }): Promise<EconomicFreeze>
  setFeatureFlag(input: { key: string; enabled: boolean; scope: FeatureFlag['scope']; scopeReference: string | null; configuration: Record<string, unknown>; actorUserId: UUID; reason: string }): Promise<FeatureFlag>
  setPlatformConfig(input: { key: string; category: string; value: unknown; effectiveFrom: string | null; actorUserId: UUID; reason: string; ticketId?: UUID | null }): Promise<PlatformConfig>
  markPaymentRefundPending(input: { orderId: UUID; actorUserId: UUID; reason: string; stripeRefundId: string }): Promise<void>
  reverseMatchSettlement(input: { matchId: UUID; reason: string; idempotencyKey: string }): Promise<Record<string, unknown>>
  reverseLedgerTransaction(input: { transactionId: UUID; reason: string; idempotencyKey: string }): Promise<UUID>
}
export interface OperationsRepository { listClubLiabilities(clubId: UUID): Promise<ClubLiability[]>; listMatchFinancialEvents(clubId: UUID, limit?: number): Promise<MatchFinancialEvent[]> }
