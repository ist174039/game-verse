import type { CurrencyCode, UUID } from './core'

export type FinancingPolicy = 'DISABLED' | 'LIMITED' | 'STANDARD' | 'OPEN'
export type LedgerDirection = 'DEBIT' | 'CREDIT'
export type LedgerScope = 'USER' | 'CLUB' | 'UNIVERSE' | 'PLATFORM'

export interface LedgerTransaction {
  id: UUID
  transactionType: string
  idempotencyKey: string | null
  referenceType: string | null
  referenceId: UUID | null
  reason: string | null
  metadata: Record<string, unknown>
  createdBy: UUID | null
  createdAt: string
}

export interface LedgerEntry {
  id: UUID
  transactionId: UUID
  direction: LedgerDirection
  currency: CurrencyCode
  scope: LedgerScope
  userAccountId: UUID | null
  clubAccountId: UUID | null
  universeAccountId: UUID | null
  amount: number
  createdAt: string
}

export interface MoneyAmount {
  currency: CurrencyCode
  amount: number
}

export function assertPositiveAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('amount_must_be_positive_integer')
}

export function assertGlobalCurrency(currency: CurrencyCode): asserts currency is 'GOLD' | 'BRONZE' {
  if (currency !== 'GOLD' && currency !== 'BRONZE') throw new Error('invalid_global_currency')
}

export function assertClubCurrency(currency: CurrencyCode): asserts currency is 'SILVER' {
  if (currency !== 'SILVER') throw new Error('invalid_club_currency')
}
