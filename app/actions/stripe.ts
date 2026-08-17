'use server'

import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function startGoldCheckout(packageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { data: goldPackage, error } = await supabase
    .from('gold_package')
    .select('id, slug, name, gold_amount, price_cents, fiat_currency, stripe_price_id, active')
    .eq('id', packageId)
    .eq('active', true)
    .single()

  if (error || !goldPackage) throw new Error('Gold package not available')

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not configured')

  const lineItem = goldPackage.stripe_price_id
    ? { price: goldPackage.stripe_price_id, quantity: 1 }
    : {
        price_data: {
          currency: goldPackage.fiat_currency,
          product_data: {
            name: goldPackage.name,
            description: `${Number(goldPackage.gold_amount).toLocaleString('pt-PT')} Gold — Clã das Sombras`,
            metadata: { app: 'cla-das-sombras', currency_type: 'GOLD' },
          },
          unit_amount: goldPackage.price_cents,
        },
        quantity: 1,
      }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [lineItem],
    client_reference_id: user.id,
    customer_email: user.email,
    success_url: `${appUrl}/economy?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/economy/buy?payment=cancelled`,
    metadata: {
      app: 'cla-das-sombras',
      user_id: user.id,
      package_id: goldPackage.id,
      package_slug: goldPackage.slug,
      currency_type: 'GOLD',
      gold_amount: String(goldPackage.gold_amount),
    },
  })

  const admin = createAdminClient()
  const { error: orderError } = await admin.from('payment_order').insert({
    user_id: user.id,
    package_id: goldPackage.id,
    stripe_session_id: session.id,
    amount_cents: goldPackage.price_cents,
    fiat_currency: goldPackage.fiat_currency,
    gold_amount: goldPackage.gold_amount,
    status: 'PENDING',
    metadata: { checkout_url_created: Boolean(session.url) },
  })

  if (orderError) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined)
    throw new Error('Unable to create payment order')
  }

  return { id: session.id, url: session.url }
}

/** @deprecated Legacy compatibility only. User identity is never accepted from the caller. */
export async function startCoinCheckout(packageId: string, _legacyUserId?: string) {
  return startGoldCheckout(packageId)
}
