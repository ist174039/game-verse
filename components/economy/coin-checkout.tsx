'use client'

import { useCallback } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, Coins, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startCoinCheckout } from '@/app/actions/stripe'
import type { CoinPackage } from '@/lib/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CoinCheckoutProps {
  coinPackage: CoinPackage
  userId: string
  onBack: () => void
}

export function CoinCheckout({ coinPackage, userId, onBack }: CoinCheckoutProps) {
  const startCheckoutSession = useCallback(
    () => startCoinCheckout(coinPackage.id, userId),
    [coinPackage.id, userId]
  )

  const totalCoins = coinPackage.coins_amount + Math.round(coinPackage.coins_amount * coinPackage.bonus_percentage / 100)
  const priceEur = (coinPackage.price_cents / 100).toFixed(2)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to packages
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Complete Purchase</h2>
            <p className="text-sm text-muted-foreground">Secure checkout powered by Stripe</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <Coins className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{totalCoins.toLocaleString()} GC</p>
              <p className="text-xs text-muted-foreground">{priceEur}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Order Summary */}
        <div className="mb-6 rounded-lg bg-secondary/30 p-4">
          <h3 className="font-medium text-foreground mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{coinPackage.name}</span>
              <span className="text-foreground">{coinPackage.coins_amount.toLocaleString()} GC</span>
            </div>
            {coinPackage.bonus_percentage > 0 && (
              <div className="flex justify-between text-accent">
                <span>Bonus (+{coinPackage.bonus_percentage}%)</span>
                <span>+{Math.round(coinPackage.coins_amount * coinPackage.bonus_percentage / 100).toLocaleString()} GC</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-medium">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{totalCoins.toLocaleString()} GC</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your payment is secured with 256-bit SSL encryption</span>
        </div>

        {/* Stripe Checkout */}
        <div className="rounded-lg border border-border overflow-hidden">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret: startCheckoutSession }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
