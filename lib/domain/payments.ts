import type { ISODateTime, UUID } from './core'

export interface GoldPackage {
  id: UUID
  slug: string
  name: string
  goldAmount: number
  priceCents: number
  fiatCurrency: string
  stripePriceId: string | null
  active: boolean
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUND_PENDING' | 'PARTIALLY_REFUNDED' | 'REFUNDED'

export interface PaymentOrder {
  id: UUID
  userId: UUID
  packageId: UUID | null
  provider: 'STRIPE'
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  amountCents: number
  fiatCurrency: string
  goldAmount: number
  status: PaymentOrderStatus
  refundedCents: number
  metadata: Record<string, unknown>
  createdAt: ISODateTime
  updatedAt: ISODateTime
}
