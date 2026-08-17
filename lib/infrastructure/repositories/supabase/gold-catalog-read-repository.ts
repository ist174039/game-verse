import type { SupabaseClient } from '@supabase/supabase-js'
import type { GoldCatalogReadRepository } from '@/lib/application/read-repositories'
import type { GoldCatalogReadModel } from '@/lib/application/read-models'
import type { GoldPackage, PaymentOrder } from '@/lib/domain/payments'
import type { UUID } from '@/lib/domain/core'

const n = (value: unknown) => Number(value ?? 0)
const mapPackage = (r:any): GoldPackage => ({ id:r.id, slug:r.slug, name:r.name, goldAmount:n(r.gold_amount), priceCents:n(r.price_cents), fiatCurrency:r.fiat_currency, stripePriceId:r.stripe_price_id, active:Boolean(r.active), sortOrder:n(r.sort_order), metadata:r.metadata ?? {}, createdAt:r.created_at, updatedAt:r.updated_at })
const mapOrder = (r:any): PaymentOrder => ({ id:r.id, userId:r.user_id, packageId:r.package_id, provider:r.provider, stripeSessionId:r.stripe_session_id, stripePaymentIntentId:r.stripe_payment_intent_id, amountCents:n(r.amount_cents), fiatCurrency:r.fiat_currency, goldAmount:n(r.gold_amount), status:r.status, refundedCents:n(r.refunded_cents), metadata:r.metadata ?? {}, createdAt:r.created_at, updatedAt:r.updated_at })

export class SupabaseGoldCatalogReadRepository implements GoldCatalogReadRepository {
  constructor(private readonly client: SupabaseClient) {}
  async load(userId: UUID): Promise<GoldCatalogReadModel> {
    const [accountResult, packagesResult, ordersResult] = await Promise.all([
      this.client.from('user_currency_account').select('balance').eq('user_id', userId).eq('currency', 'GOLD').maybeSingle(),
      this.client.from('gold_package').select('*').eq('active', true).order('sort_order', { ascending:true }),
      this.client.from('payment_order').select('*').eq('user_id', userId).order('created_at', { ascending:false }).limit(8),
    ])
    if (accountResult.error) throw accountResult.error
    if (packagesResult.error) throw packagesResult.error
    if (ordersResult.error) throw ordersResult.error
    return { balance:n(accountResult.data?.balance), packages:(packagesResult.data ?? []).map(mapPackage), recentOrders:(ordersResult.data ?? []).map(mapOrder) }
  }
}
