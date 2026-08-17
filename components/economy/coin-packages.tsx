'use client'

import { useState } from 'react'
import { Coins, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CoinPackage } from '@/lib/types'
import { CoinCheckout } from './coin-checkout'

interface CoinPackagesProps {
  packages: CoinPackage[]
  userId: string
}

export function CoinPackages({ packages, userId }: CoinPackagesProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null)

  if (selectedPackage) {
    return (
      <CoinCheckout 
        coinPackage={selectedPackage} 
        userId={userId}
        onBack={() => setSelectedPackage(null)}
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold text-foreground">Buy GameCoins</h2>
        <p className="text-sm text-muted-foreground">Choose a package to add GameCoins to your wallet</p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg, index) => {
          const isPopular = index === 1
          const priceEur = (pkg.price_cents / 100).toFixed(2)
          const totalCoins = pkg.coins_amount + Math.round(pkg.coins_amount * pkg.bonus_percentage / 100)

          return (
            <div
              key={pkg.id}
              className={`relative rounded-xl border p-4 transition-all hover:border-primary/50 ${
                isPopular 
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
                <div className="mt-2 flex items-center justify-center gap-1 text-sm text-accent">
                  <Sparkles className="h-4 w-4" />
                  <span>+{pkg.bonus_percentage}% bonus ({totalCoins.toLocaleString()} total)</span>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <Button
                  className={`w-full ${
                    isPopular 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : ''
                  }`}
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  Buy for {priceEur}
                </Button>
              </div>

              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-accent" />
                  <span>Instant delivery</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-accent" />
                  <span>Secure payment</span>
                </li>
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
