'use server'

import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIAT_CURRENCIES = new Set(['eur'])

export async function startGoldCheckout(packageId: string) {
  if (!packageId) throw new Error('Pacote Gold inválido.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) throw new Error('É necessário iniciar sessão.')

  const { data: goldPackage, error } = await supabase
    .from('gold_package')
    .select('id,slug,name,gold_amount,price_cents,fiat_currency,stripe_price_id,active,metadata')
    .eq('id', packageId)
    .eq('active', true)
    .single()

  if (error || !goldPackage) throw new Error('Este pacote Gold já não está disponível.')

  const goldAmount = Number(goldPackage.gold_amount)
  const priceCents = Number(goldPackage.price_cents)
  const fiatCurrency = String(goldPackage.fiat_currency).toLowerCase()
  if (!Number.isSafeInteger(goldAmount) || goldAmount <= 0 || !Number.isSafeInteger(priceCents) || priceCents <= 0 || !ALLOWED_FIAT_CURRENCIES.has(fiatCurrency)) {
    throw new Error('A configuração deste pacote é inválida.')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) throw new Error('O checkout ainda não está configurado.')

  const admin = createAdminClient()
  const { data: order, error: orderError } = await admin
    .from('payment_order')
    .insert({
      user_id: user.id,
      package_id: goldPackage.id,
      amount_cents: priceCents,
      fiat_currency: fiatCurrency,
      gold_amount: goldAmount,
      status: 'PENDING',
      metadata: {
        package_slug: goldPackage.slug,
        package_name: goldPackage.name,
        package_metadata: goldPackage.metadata ?? {},
        checkout_version: 2,
      },
    })
    .select('id')
    .single()

  if (orderError || !order) throw new Error('Não foi possível preparar a ordem de pagamento.')

  try {
    const stripe = getStripe()
    let lineItem
    if (goldPackage.stripe_price_id) {
      const stripePrice = await stripe.prices.retrieve(goldPackage.stripe_price_id)
      if (!stripePrice.active || stripePrice.type !== 'one_time' || stripePrice.unit_amount !== priceCents || stripePrice.currency.toLowerCase() !== fiatCurrency) {
        throw new Error('Stripe price does not match package snapshot')
      }
      lineItem = { price: stripePrice.id, quantity: 1 }
    } else {
      lineItem = {
        price_data: {
          currency: fiatCurrency,
          product_data: {
            name: `${goldPackage.name} — ${goldAmount.toLocaleString('pt-PT')} Gold`,
            description: 'Gold global do manager no Clã das Sombras',
            metadata: { app: 'cla-das-sombras', currency_type: 'GOLD', package_slug: goldPackage.slug },
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'pt',
      line_items: [lineItem],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${appUrl}/economy/buy?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/economy/buy?payment=cancelled`,
      metadata: {
        app: 'cla-das-sombras',
        order_id: order.id,
        user_id: user.id,
        package_id: goldPackage.id,
        package_slug: goldPackage.slug,
        currency_type: 'GOLD',
        gold_amount: String(goldAmount),
      },
    }, { idempotencyKey: `gold_checkout_${order.id}` })

    if (!session.url) throw new Error('Stripe checkout URL unavailable')

    const { error: sessionUpdateError } = await admin
      .from('payment_order')
      .update({ stripe_session_id: session.id, metadata: { package_slug: goldPackage.slug, package_name: goldPackage.name, package_metadata: goldPackage.metadata ?? {}, checkout_version: 2, checkout_url_created: true } })
      .eq('id', order.id)
      .eq('status', 'PENDING')

    if (sessionUpdateError) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined)
      throw new Error('Unable to attach checkout session')
    }

    return { id: session.id, url: session.url }
  } catch (checkoutError) {
    await admin
      .from('payment_order')
      .update({ status: 'FAILED', metadata: { package_slug: goldPackage.slug, package_name: goldPackage.name, checkout_version: 2, checkout_creation_failed: true } })
      .eq('id', order.id)
      .eq('status', 'PENDING')
    console.error('Gold checkout creation failed', { orderId: order.id, error: checkoutError })
    throw new Error('Não foi possível iniciar o pagamento seguro. Tenta novamente.')
  }
}

/** @deprecated Legacy compatibility only. User identity is never accepted from the caller. */
export async function startCoinCheckout(packageId: string, _legacyUserId?: string) {
  return startGoldCheckout(packageId)
}
