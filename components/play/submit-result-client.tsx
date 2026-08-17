'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Swords, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SubmitResultClientProps {
  matchId: string
  userId: string
  isCreator: boolean
  opponentName: string
}

export function SubmitResultClient({ matchId, userId, isCreator, opponentName }: SubmitResultClientProps) {
  const router = useRouter()
  const [myScore, setMyScore] = useState('')
  const [opponentScore, setOpponentScore] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const my = parseInt(myScore)
    const opp = parseInt(opponentScore)

    if (isNaN(my) || isNaN(opp)) {
      setError('Please enter valid scores')
      return
    }
    if (my < 0 || opp < 0) {
      setError('Scores cannot be negative')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      let screenshotUrl: string | null = null

      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop()
        const filePath = `screenshots/${matchId}_${userId}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('match-screenshots')
          .upload(filePath, screenshot, { upsert: true })

        if (uploadError) throw new Error('Failed to upload screenshot')
        screenshotUrl = uploadData.path
      }

      const scoreField = isCreator ? 'creator_score' : 'opponent_score'
      const updateData: Record<string, unknown> = {
        [scoreField]: my,
        state: 'WAITING_CONFIRMATION',
      }

      if (isCreator) {
        updateData.opponent_score = opp
      } else {
        updateData.creator_score = opp
      }

      if (screenshotUrl) {
        updateData.screenshot_url = screenshotUrl
      }

      const { error: updateError } = await supabase
        .from('match')
        .update(updateData)
        .eq('id', matchId)

      if (updateError) throw updateError

      router.push('/play')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit result')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link
        href="/play"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Matches
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Swords className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Submit Result</h1>
            <p className="text-sm text-muted-foreground">vs {opponentName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="myScore">Your Score</Label>
              <Input
                id="myScore"
                type="number"
                min="0"
                max="99"
                placeholder="0"
                value={myScore}
                onChange={(e) => setMyScore(e.target.value)}
                className="bg-input border-border text-center text-2xl font-bold h-16"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opponentScore">Opponent Score</Label>
              <Input
                id="opponentScore"
                type="number"
                min="0"
                max="99"
                placeholder="0"
                value={opponentScore}
                onChange={(e) => setOpponentScore(e.target.value)}
                className="bg-input border-border text-center text-2xl font-bold h-16"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot (optional)</Label>
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/20 p-6 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => document.getElementById('screenshot')?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {screenshot ? screenshot.name : 'Click to upload screenshot'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
            </div>
            <input
              id="screenshot"
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-accent/10 p-3 text-sm text-accent">
            <p className="font-medium">After submitting:</p>
            <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground">
              <li>The match enters WAITING_CONFIRMATION state</li>
              <li>{opponentName} must confirm the result within 48h</li>
              <li>If unconfirmed after 48h, result is auto-confirmed</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Result
          </Button>
        </form>
      </div>
    </div>
  )
}
