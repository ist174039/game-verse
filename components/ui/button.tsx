import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'border-primary/80 bg-gradient-to-b from-[#ffd54a] to-primary text-primary-foreground shadow-[0_8px_22px_rgba(245,191,22,.14),inset_0_1px_0_rgba(255,255,255,.34)] hover:border-[#ffe174] hover:from-[#ffdc60] hover:to-[#f7c62d] hover:shadow-[0_10px_28px_rgba(245,191,22,.20),inset_0_1px_0_rgba(255,255,255,.38)]',
        outline:
          'border-white/[.10] bg-white/[.025] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.025)] hover:border-primary/30 hover:bg-primary/[.055] hover:text-[#fff7dc]',
        secondary:
          'border-white/[.07] bg-[#171717] text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.035)] hover:border-white/[.12] hover:bg-[#1d1d1d] hover:text-foreground',
        ghost:
          'border-transparent bg-transparent text-[#aaa69e] hover:border-white/[.055] hover:bg-white/[.04] hover:text-foreground',
        destructive:
          'border-destructive/35 bg-destructive/12 text-[#ff8585] shadow-[inset_0_1px_0_rgba(255,255,255,.025)] hover:border-destructive/55 hover:bg-destructive/20 hover:text-[#ff9b9b] focus-visible:ring-destructive/30',
        link:
          'h-auto border-transparent bg-transparent px-0 text-primary shadow-none underline-offset-4 hover:text-[#ffd85a] hover:underline',
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-7 gap-1.5 rounded-lg px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[.65rem] px-3.5 text-[0.8125rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 rounded-xl px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        icon: "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-4.5",
        'icon-xs': "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': "size-9 rounded-[.65rem] [&_svg:not([class*='size-'])]:size-3.5",
        'icon-lg': "size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[1.125rem]",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
