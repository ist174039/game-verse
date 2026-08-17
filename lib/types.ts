// Database types for GameVerse

export interface UserProfile {
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

export interface Club {
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

export interface Wallet {
  id: string
  user_id: string
  balance: number
  infrastructure_credit: number
  updated_at: string
}

export interface CoinTransaction {
  id: string
  user_id: string
  wallet_id: string
  type: 'credit' | 'debit'
  amount: number
  source_type: 'match' | 'tournament' | 'reward' | 'purchase' | 'admin' | 'penalty' | 'market' | 'fee' | 'infra_bonus' | 'passive_finance'
  source_id: string | null
  description: string | null
  balance_before: number
  balance_after: number
  created_at: string
}

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

export type InfrastructureCardType = 'stadium' | 'academy' | 'training' | 'marketing' | 'finance'

export interface ClubInfrastructure {
  id: string
  club_id: string
  card_type: InfrastructureCardType
  level: number
  active: boolean
  bonus_pct: number
  activated_at: string
}

// Extended types with relations
export interface UserWithRelations extends UserProfile {
  club?: Club
  wallet?: Wallet
}

export interface ClubWithInfrastructure extends Club {
  infrastructure?: ClubInfrastructure[]
}

// Dashboard data
export interface DashboardData {
  profile: UserProfile
  club: Club
  wallet: Wallet
  recentTransactions: CoinTransaction[]
  infrastructure: ClubInfrastructure[]
}

// Match types
export type MatchType = 'casual' | 'ranked' | 'tournament'
export type MatchState =
  | 'CREATED'
  | 'WAITING_CONFIRMATION'
  | 'CONFIRMED_BY_ONE'
  | 'CONFIRMED'
  | 'DISPUTED'
  | 'AUTO_CONFIRMED'
  | 'ECONOMY_UPDATE'
  | 'RANKING_UPDATE'

export interface Match {
  id: string
  creator_id: string
  opponent_id: string | null
  match_type: MatchType
  state: MatchState
  creator_score: number | null
  opponent_score: number | null
  screenshot_url: string | null
  winner_id: string | null
  tournament_id: string | null
  created_at: string
  updated_at: string
}

export interface MatchWithPlayers extends Match {
  creator?: Pick<UserProfile, 'id' | 'username' | 'avatar_url' | 'elo_rating'>
  opponent?: Pick<UserProfile, 'id' | 'username' | 'avatar_url' | 'elo_rating'>
}

// Tournament types
export type TournamentFormat = 'knockout' | 'round_robin' | 'swiss'
export type TournamentStatus = 'registration' | 'in_progress' | 'completed' | 'cancelled'

export interface Tournament {
  id: string
  name: string
  description: string | null
  creator_id: string
  format: TournamentFormat
  entry_fee: number
  max_participants: number
  current_participants: number
  prize_pool: number
  status: TournamentStatus
  starts_at: string
  created_at: string
  updated_at: string
}

export interface TournamentRegistration {
  id: string
  tournament_id: string
  user_id: string
  seed: number
  status: 'pending' | 'confirmed' | 'eliminated' | 'winner'
  created_at: string
}

export interface TournamentMatch {
  id: string
  tournament_id: string
  round: number
  match_index: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  score_player1: number | null
  score_player2: number | null
  status: 'scheduled' | 'in_progress' | 'completed'
  created_at: string
}

// Market types
export type ListingStatus = 'active' | 'sold' | 'cancelled'

export interface MarketListing {
  id: string
  seller_id: string
  card_name: string
  card_rarity: 'common' | 'rare' | 'epic' | 'legendary'
  card_type: string | null
  description: string | null
  price: number
  status: ListingStatus
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface MarketListingWithSeller extends MarketListing {
  seller?: Pick<UserProfile, 'id' | 'username' | 'avatar_url'>
}

// Social types
export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export interface FriendWithProfile extends Friend {
  friend?: Pick<UserProfile, 'id' | 'username' | 'avatar_url' | 'elo_rating' | 'prestige_level'>
}

export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string | null
  channel: 'direct' | 'community' | 'tournament'
  channel_id: string | null
  content: string
  created_at: string
}

export interface ChatMessageWithSender extends ChatMessage {
  sender?: Pick<UserProfile, 'id' | 'username' | 'avatar_url'>
}

// Activity feed
export interface ActivityItem {
  id: string
  user_id: string
  type: 'match' | 'tournament' | 'achievement' | 'market' | 'social'
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ActivityWithUser extends ActivityItem {
  user?: Pick<UserProfile, 'id' | 'username' | 'avatar_url'>
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

// Friendship types
export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

// --- Tournament Economy types ---

export interface TournamentEconomy {
  id: string
  tournament_id: string
  entry_fee: number
  total_prize_pool: number
  distribution_config: Record<number, number>
  status: 'pending' | 'ready' | 'distributing' | 'distributed'
  total_distributed: number | null
  distributed_at: string | null
}

export interface TournamentParticipant {
  id: string
  tournament_id: string
  club_id: string
  user_id: string
  seed: number
  final_position: number
  status: 'registered' | 'confirmed' | 'eliminated' | 'winner'
}

export interface TournamentPayout {
  id: string
  tournament_id: string
  club_id: string
  user_id: string
  position: number
  amount_gc: number
  status: 'pending' | 'paid' | 'failed'
  paid_at: string | null
}

// --- League types ---

export interface LeagueSeason {
  id: string
  name: string
  season_year: number
  season_number: number
  status: 'active' | 'completed' | 'archived'
  starts_at: string
  ends_at: string
}

export interface LeagueDivisionEntry {
  id: string
  league_season_id: string
  club_id: string
  division: string
  points: number
  goals_for: number
  goals_against: number
  rank: number
  qualified_for_next: boolean
}

// --- Elo History ---

export interface EloHistory {
  id: string
  club_id: string
  match_id: string
  elo_before: number
  elo_after: number
  elo_change: number
  created_at: string
}

// --- Auction types ---

export interface AuctionBid {
  id: string
  listing_id: string
  bidder_id: string
  amount: number
  created_at: string
}

// --- Rivalry types ---

export interface Rivalry {
  id: string
  club_a_id: string
  club_b_id: string
  total_matches: number
  club_a_wins: number
  club_b_wins: number
  draws: number
  intensity: 'emerging' | 'growing' | 'established' | 'legendary'
  last_match_at: string
}

// --- Mission types ---

export interface Mission {
  id: string
  title: string
  description: string | null
  criteria: Record<string, unknown> | null
  reward_gc: number
  active: boolean
}

export interface UserMission {
  id: string
  user_id: string
  mission_id: string
  progress: number
  target: number
  status: 'active' | 'completed' | 'claimed'
  completed_at: string | null
}

// --- Contract types ---

export interface InvestmentContract {
  id: string
  investor_id: string
  club_id: string
  amount_gc: number
  profit_percent: number
  season_year: number
  status: 'active' | 'completed' | 'cancelled'
  completed_at: string | null
}

// --- Loan types ---

export interface Loan {
  id: string
  club_id: string
  amount_gc: number
  interest_percent: number
  remaining_balance: number
  due_date: string
  status: 'active' | 'defaulted' | 'paid'
}

// --- Sponsorship types ---

export interface ClubSponsorship {
  id: string
  club_id: string
  sponsor_type: string
  cost_gc: number
  bonus_percent: number
  active: boolean
  starts_at: string
  ends_at: string
}

// --- Daily Reward ---

export interface DailyReward {
  id: string
  user_id: string
  streak: number
  last_claimed_at: string
}

// --- News Event ---

export interface NewsEvent {
  id: string
  title: string
  body: string | null
  category: string
  importance: 'normal' | 'high' | 'breaking'
  related_match_id: string | null
  related_club_id: string | null
  metadata: Record<string, unknown> | null
  published_at: string
  expires_at: string | null
}
