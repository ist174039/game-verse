import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature')

  if (!webhookSecret) return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 })
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await settleCompletedCheckout(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await markExpiredCheckout(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.async_payment_failed':
        await markFailedCheckout(event.data.object as Stripe.Checkout.Session)
        break
      case 'charge.refunded':
        await registerRefund(event.data.object as Stripe.Charge)
        break
    }
  } catch (error) {
    console.error('Stripe webhook processing failed', { eventId: event.id, eventType: event.type, error })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function settleCompletedCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return
  if (session.metadata?.app !== 'cla-das-sombras' || session.metadata?.currency_type !== 'GOLD') return

  const admin = createAdminClient()
  const orderId = session.metadata?.order_id
  const orderQuery = admin.from('payment_order').select('*')
  const { data: order, error: orderError } = orderId
    ? await orderQuery.eq('id', orderId).eq('stripe_session_id', session.id).single()
    : await orderQuery.eq('stripe_session_id', session.id).single()

  if (orderError || !order) throw new Error(`Payment order not found for ${session.id}`)
  if (['PAID','PARTIALLY_REFUNDED','REFUNDED'].includes(order.status)) return
  if (order.status !== 'PENDING') throw new Error(`Payment order ${order.id} is not pending`)

  const metadataUserId = session.metadata?.user_id
  const metadataGold = Number(session.metadata?.gold_amount)
  if (!metadataUserId || metadataUserId !== order.user_id) throw new Error('Payment user mismatch')
  if (!Number.isSafeInteger(metadataGold) || metadataGold <= 0 || metadataGold !== Number(order.gold_amount)) throw new Error('Gold amount mismatch')
  if (session.metadata?.package_id !== order.package_id) throw new Error('Gold package mismatch')
  if (session.amount_total !== Number(order.amount_cents)) throw new Error('Payment amount mismatch')
  if (session.currency?.toLowerCase() !== String(order.fiat_currency).toLowerCase()) throw new Error('Payment currency mismatch')

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

  const { error: grantError } = await admin.rpc('service_grant_user_currency', {
    p_user_id: order.user_id,
    p_currency: 'GOLD',
    p_amount: order.gold_amount,
    p_transaction_type: 'STRIPE_GOLD_PURCHASE',
    p_reason: `Stripe checkout ${session.id}`,
    p_idempotency_key: `stripe_checkout_${session.id}_gold`,
  })
  if (grantError) throw grantError

  const { error: updateError } = await admin
    .from('payment_order')
    .update({
      status: 'PAID',
      stripe_payment_intent_id: paymentIntentId || null,
      metadata: { ...order.metadata, stripe_event_settled: true, stripe_payment_status: session.payment_status },
    })
    .eq('id', order.id)
    .eq('status', 'PENDING')
  if (updateError) throw updateError
}

async function markExpiredCheckout(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('payment_order')
    .update({ status: 'EXPIRED' })
    .eq('stripe_session_id', session.id)
    .eq('status', 'PENDING')
  if (error) throw error
}

async function markFailedCheckout(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const orderId = session.metadata?.order_id
  let query = admin.from('payment_order').update({ status: 'FAILED' }).eq('status', 'PENDING')
  query = orderId ? query.eq('id', orderId).eq('stripe_session_id', session.id) : query.eq('stripe_session_id', session.id)
  const { error } = await query
  if (error) throw error
}

async function registerRefund(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return

  const admin = createAdminClient()
  const { data: order, error: orderError } = await admin
    .from('payment_order')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()
  if (orderError) throw orderError
  if (!order) return

  const refunded = charge.amount_refunded || 0
  const fullyRefunded = refunded >= order.amount_cents
  const { error } = await admin
    .from('payment_order')
    .update({
      refunded_cents: refunded,
      status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      metadata: { ...order.metadata, gold_reconciliation_required: true },
    })
    .eq('id', order.id)
  if (error) throw error

  // Gold is intentionally NOT clawed back automatically here. Refund reconciliation
  // must inspect remaining Gold and any Silver financing already derived from it.
}
