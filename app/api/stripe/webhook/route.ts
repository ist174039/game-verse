import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers.get('stripe-signature')

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 503 },
    )
  }

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 },
    )
  }

  const buf = await req.text()

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const supabase = await createClient()

      const { data: fiatTx } = await supabase
        .from('fiat_transaction')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single()

      if (fiatTx) {
        await supabase
          .from('fiat_transaction')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fiatTx.id)

        const { error: creditError } = await supabase.rpc('credit_gc', {
          p_user_id: fiatTx.user_id,
          p_amount: fiatTx.gc_amount,
          p_reason: 'purchase_' + fiatTx.package_slug,
          p_idempotency_key: `stripe_session_${session.id}`,
        })

        if (creditError) {
          console.error('Failed to credit GC:', creditError)
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const expiredSession = event.data.object as any
      const supabase = await createClient()

      await supabase
        .from('fiat_transaction')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('stripe_session_id', expiredSession.id)

      break
    }
  }

  return NextResponse.json({ received: true })
}
