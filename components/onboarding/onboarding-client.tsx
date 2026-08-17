'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Shield, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

interface OnboardingClientProps {
  userId: string
}

const emblems = ['🦁', '🐉', '🦅', '🐺', '⚡', '🌊', '🔥', '🛡️']

const emblemColors = [
  { name: 'Red', class: 'bg-red-600' },
  { name: 'Blue', class: 'bg-blue-600' },
  { name: 'Green', class: 'bg-green-600' },
  { name: 'Purple', class: 'bg-purple-600' },
  { name: 'Orange', class: 'bg-orange-600' },
  { name: 'Black', class: 'bg-gray-900' },
]

export function OnboardingClient({ userId }: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Step 1 - Welcome (auto-progress)
  // Step 2 - Create Club
  const [clubName, setClubName] = useState('')
  const [motto, setMotto] = useState('')
  const [selectedEmblem, setSelectedEmblem] = useState('🦁')
  const [selectedColor, setSelectedColor] = useState('bg-red-600')

  // Step 3 - Starter Pack

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">GameVerse</span>
          </div>
          <p className="text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-xl font-bold text-foreground">Welcome to GameVerse!</h2>
              <p className="text-sm text-muted-foreground">
                Get ready to build your club, collect players, and compete in tournaments.
                Let's set you up in just a few steps!
              </p>
              <Button onClick={handleNext} className="mt-4">
                Let's Start!
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🏟️</div>
                <h2 className="text-xl font-bold text-foreground">Create Your Club</h2>
                <p className="text-sm text-muted-foreground">Choose your club's identity</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Club Name</Label>
                  <Input
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g. CarloFC"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Motto</Label>
                  <Input
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    placeholder="e.g. Never Give Up!"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    {emblemColors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.class)}
                        className={`h-8 w-8 rounded-full ${c.class} ${
                          selectedColor === c.class ? 'ring-2 ring-offset-2 ring-foreground' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Emblem</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {emblems.map((e) => (
                      <button
                        key={e}
                        onClick={() => setSelectedEmblem(e)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
                          selectedEmblem === e
                            ? 'bg-primary/20 ring-2 ring-primary'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className={`inline-flex items-center gap-3 rounded-lg ${selectedColor} px-4 py-3 text-white`}>
                  <span className="text-2xl">{selectedEmblem}</span>
                  <div className="text-left">
                    <p className="font-bold">{clubName || 'Your Club'}</p>
                    <p className="text-xs opacity-80">{motto || 'Your motto here'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h2 className="text-xl font-bold text-foreground">Your Starter Pack</h2>
              <p className="text-sm text-muted-foreground">
                As a new manager, you receive:
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">1,000 GameCoins</p>
                    <p className="text-xs text-muted-foreground">To start building your squad</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-lg">🏗️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">1 Infrastructure Credit</p>
                    <p className="text-xs text-muted-foreground">Build your first facility</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="text-lg">🃏</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Starter Cards Pack</p>
                    <p className="text-xs text-muted-foreground">11 players to fill your squad</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-sm text-muted-foreground">
                Your club is ready. Here's what you can do next:
              </p>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <span className="text-2xl">⚽</span>
                  <p className="text-xs font-medium text-foreground mt-1">Play Matches</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <span className="text-2xl">🏆</span>
                  <p className="text-xs font-medium text-foreground mt-1">Join Tournaments</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <span className="text-2xl">🛒</span>
                  <p className="text-xs font-medium text-foreground mt-1">Buy Cards</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <span className="text-2xl">🤝</span>
                  <p className="text-xs font-medium text-foreground mt-1">Socialize</p>
                </div>
              </div>

              <Button onClick={handleComplete} className="mt-4 w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Enter GameVerse!
              </Button>
            </div>
          )}
        </Card>

        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
