'use client'

import { useState } from 'react'
import { Coins, Sparkles, ShoppingCart, Shield, CreditCard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { CoinPackage } from '@/lib/types'

interface BuyGameCoinsClientProps {
  userId: string
  packages: CoinPackage[]
}

export function BuyGameCoinsClient({ userId, packages }: BuyGameCoinsClientProps) {
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  const handleSelectPackage = (pkg: CoinPackage) => {
    setSelectedPkg(pkg)
    setShowCheckout(true)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <button onClick={() => window.history.back()} className="hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs">Back to Economy</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Coins className="h-6 w-6 text-chart-4" />
          Buy GameCoins
        </h1>
        <p className="text-muted-foreground">Choose a package to add GameCoins to your wallet</p>
      </div>

      {/* Special Offer */}
      <Card className="p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">🎉 First Purchase Bonus!</p>
            <p className="text-xs text-muted-foreground">Get an extra 10% bonus on your first GameCoins purchase</p>
          </div>
        </div>
      </Card>

      {/* Package Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {packages.map((pkg, idx) => {
          const isPopular = idx === 1
          const priceEur = (pkg.price_cents / 100).toFixed(2)
          const totalCoins = pkg.coins_amount + Math.round(pkg.coins_amount * pkg.bonus_percentage / 100)

          return (
            <div
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg)}
              className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all hover:border-primary/50 ${
                selectedPkg?.id === pkg.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-500/30'
                  : isPopular
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="flex items-center justify-center mb-4 mt-2">
                <div className={`rounded-full p-3 ${isPopular ? 'bg-primary/20' : 'bg-secondary'}`}>
                  <Coins className={`h-8 w-8 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>

              <h3 className="text-center font-semibold text-foreground">{pkg.name}</h3>

              <div className="mt-3 text-center">
                <span className="text-3xl font-bold text-foreground">{pkg.coins_amount.toLocaleString()}</span>
                <span className="ml-1 text-muted-foreground">GC</span>
              </div>

              {pkg.bonus_percentage > 0 && (
                <div className="mt-2 flex items-center justify-center gap-1 text-sm text-emerald-500">
                  <Sparkles className="h-4 w-4" />
                  <span>+{pkg.bonus_percentage}% bonus ({totalCoins.toLocaleString()} total)</span>
                </div>
              )}

              <div className="mt-4 text-center">
                <span className="text-2xl font-black text-foreground">€{priceEur}</span>
              </div>

              <Button
                className={`w-full mt-3 ${
                  isPopular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : ''
                }`}
                variant={isPopular ? 'default' : 'outline'}
                onClick={() => handleSelectPackage(pkg)}
              >
                {selectedPkg?.id === pkg.id ? '✓ Selected' : 'Select'}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Checkout Section */}
      {selectedPkg && (
        <Card className="p-6 border-green-500/30">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            Checkout Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium text-foreground">{selectedPkg.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GameCoins</span>
              <span className="font-medium text-foreground">
                {selectedPkg.coins_amount.toLocaleString()} GC
                {selectedPkg.bonus_percentage > 0 && (
                  <span className="text-emerald-500 ml-1">
                    (+{Math.round(selectedPkg.coins_amount * selectedPkg.bonus_percentage / 100).toLocaleString()} bonus)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-black text-foreground">
                €{(selectedPkg.price_cents / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Shield className="h-3 w-3" />
              <span>Secure payment via Stripe</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setSelectedPkg(null); setShowCheckout(false) }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1">
                <CreditCard className="mr-2 h-4 w-4" />
                Pay €{(selectedPkg.price_cents / 100).toFixed(2)}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          SSL Secure
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Stripe Verified
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Instant Delivery
        </div>
      </div>
    </div>
  )
}
