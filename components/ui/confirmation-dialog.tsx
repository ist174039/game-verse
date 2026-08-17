'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type ConfirmationTone = 'default' | 'warning' | 'danger' | 'success'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmationTone
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
}

const toneConfig = {
  default: { icon: Info, iconClass: 'text-primary', panelClass: 'border-primary/15 bg-primary/[.055]' },
  warning: { icon: AlertTriangle, iconClass: 'text-warning', panelClass: 'border-warning/20 bg-warning/[.06]' },
  danger: { icon: ShieldAlert, iconClass: 'text-destructive', panelClass: 'border-destructive/20 bg-destructive/[.06]' },
  success: { icon: CheckCircle2, iconClass: 'text-success', panelClass: 'border-success/20 bg-success/[.06]' },
} satisfies Record<ConfirmationTone, { icon: typeof Info; iconClass: string; panelClass: string }>

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmationDialogProps) {
  const config = toneConfig[tone]
  const Icon = config.icon

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isLoading}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', config.panelClass)}>
              <Icon className={cn('size-5', config.iconClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        {children && <DialogBody>{children}</DialogBody>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'destructive' : 'default'} onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'A processar…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
