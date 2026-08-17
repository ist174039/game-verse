'use server'

import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function startCoinCheckout(packageId: string, userId: string) {
  const supabase = await createClient()

  const { data: coinPackage, error } = await supabase
    .from('coin_package')
    .select('*')
    .eq('id', packageId)
    .single()

  if (error || !coinPackage) {
    throw new Error('Coin package not found')
  }

  const totalCoins =
    coinPackage.coins_amount +
    Math.round((coinPackage.coins_amount * coinPackage.bonus_percentage) / 100)

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: coinPackage.name,
            description: `${totalCoins.toLocaleString()} Gold${
              coinPackage.bonus_percentage > 0
                ? ` (inclui ${coinPackage.bonus_percentage}% de bónus)`
                : ''
            }`,
          },
          unit_amount: coinPackage.price_cents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      package_id: packageId,
      user_id: userId,
      currency_type: 'GOLD',
      coins_to_grant: totalCoins.toString(),
    },
  })

  await supabase.from('fiat_transaction').insert({
    user_id: userId,
    package_id: packageId,
    stripe_session_id: session.id,
    amount_cents: coinPackage.price_cents,
    coins_granted: totalCoins,
    status: 'pending',
  })

  return session.client_secret
}
