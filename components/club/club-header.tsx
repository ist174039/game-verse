'use client'

import { useState } from 'react'
import { Shield, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Club } from '@/lib/types'

interface ClubHeaderProps {
  club: Club
}

export function ClubHeader({ club }: ClubHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(club.name)
  const [motto, setMotto] = useState(club.motto || '')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('club')
      .update({ name, motto, updated_at: new Date().toISOString() })
      .eq('id', club.id)

    if (!error) {
      setIsEditing(false)
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleCancel = () => {
    setName(club.name)
    setMotto(club.motto || '')
    setIsEditing(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 glow-gold">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Club name"
                className="text-lg font-semibold bg-input border-border"
              />
              <Input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Club motto"
                className="text-sm bg-input border-border"
              />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-foreground">{club.name}</h1>
              <p className="text-muted-foreground">{club.motto || 'No motto set'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Established {new Date(club.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-border"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
