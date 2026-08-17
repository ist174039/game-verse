import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const buf = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const supabase = await createClient()

      // Find fiat_transaction by stripe_session_id
      const { data: fiatTx } = await supabase
        .from('fiat_transaction')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single()

      if (fiatTx) {
        // Update transaction to completed
        await supabase
          .from('fiat_transaction')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fiatTx.id)

        // Grant coins
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
