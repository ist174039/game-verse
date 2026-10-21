import { cn } from '@/lib/utils'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full resize-y rounded-xl border border-white/[.08] bg-[#111111] px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground/80 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] transition-[border-color,box-shadow,background-color] hover:border-white/[.12] focus-visible:border-primary/55 focus-visible:bg-[#131313] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 sm:text-sm',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
