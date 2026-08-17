export type Currency = 'GOLD' | 'SILVER' | 'BRONZE'

export type LedgerEntryType =
  | 'SOURCE'
  | 'TRANSFER'
  | 'SINK'
  | 'REVERSAL'
  | 'ADJUSTMENT'

export type LedgerReason =
  | 'STRIPE_PURCHASE'
  | 'STARTING_GRANT'
  | 'CLUB_CAPITAL_INJECTION'
  | 'UNIVERSE_FUNDING'
  | 'SPONSORSHIP_FUNDING'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT'
  | 'PLAYER_PLATFORM_PURCHASE'
  | 'PLAYER_MARKET_SALE'
  | 'PLAYER_AUCTION'
  | 'PLAYER_QUICK_SELL'
  | 'MARKET_FEE'
  | 'AUCTION_FEE'
  | 'SALARY_PAYMENT'
  | 'INFRASTRUCTURE_MAINTENANCE'
  | 'COMPETITION_FEE'
  | 'TICKET_REVENUE'
  | 'SPONSOR_REVENUE'
  | 'COMPETITION_PRIZE'
  | 'DAILY_REWARD'
  | 'MISSION_REWARD'
  | 'ACHIEVEMENT_REWARD'
  | 'PREMIUM_PURCHASE'
  | 'UNIVERSE_CREATION'
  | 'UNIVERSE_UPGRADE'
  | 'ADMIN_GRANT'
  | 'ECONOMIC_REVERSAL'

export type WalletScope =
  | { kind: 'USER_GOLD'; userId: string }
  | { kind: 'USER_BRONZE'; userId: string }
  | { kind: 'CLUB_SILVER'; clubId: string; universeId: string }
  | { kind: 'UNIVERSE_SILVER'; universeId: string }
  | { kind: 'PLATFORM_SINK'; currency: Currency }

export interface LedgerEntry {
  id: string
  idempotencyKey: string
  currency: Currency
  entryType: LedgerEntryType
  reason: LedgerReason
  amount: number
  source: WalletScope | null
  destination: WalletScope | null
  userId?: string | null
  clubId?: string | null
  universeId?: string | null
  externalReference?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
}

export type FinancingPolicy = 'DISABLED' | 'LIMITED' | 'STANDARD' | 'OPEN'

export interface ClubFinancingRule {
  policy: FinancingPolicy
  seasonalLimitPercentOfStartingBudget: number | null
  sponsorshipCountsTowardLimit: boolean
}

export interface CapitalInjectionProduct {
  code: string
  goldCost: number
  silverGranted: number
  active: boolean
}

export interface LoanProduct {
  code: string
  silverPrincipal: number
  goldOriginationFee: number
  repaymentSilver: number
  installments: number
  active: boolean
}

export const ECONOMY_INVARIANTS = {
  goldScope: 'GLOBAL_USER',
  silverScope: 'UNIVERSE_CLUB',
  bronzeScope: 'GLOBAL_USER',
  silverCanLeaveUniverse: false,
  freeCurrencyConversion: false,
  ledgerFirst: true,
  directBalanceMutationAllowed: false,
} as const
