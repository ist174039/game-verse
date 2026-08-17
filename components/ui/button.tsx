import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Clã das Sombras button language
 *
 * Principles:
 * - primary action is solid gold, not glossy/gaming chrome;
 * - normal product actions stay neutral;
 * - premium is reserved for high-value/identity moments;
 * - destructive actions never reuse brand gold;
 * - minimum interactive height is touch-friendly on mobile;
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] border text-sm font-bold tracking-[-0.012em] outline-none select-none transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Main conversion / primary product action.
        default:
          "border-[#e7ad00] bg-[#f2b705] text-[#090909] shadow-[0_1px_0_rgba(255,235,150,.42)_inset,0_5px_16px_rgba(242,183,5,.10)] hover:-translate-y-[1px] hover:border-[#f6c72e] hover:bg-[#f8c526] hover:shadow-[0_1px_0_rgba(255,239,170,.5)_inset,0_8px_22px_rgba(242,183,5,.15)] active:translate-y-0 active:bg-[#e7ad00]",

        // Standard secondary action. This should be the most common non-primary button.
        outline:
          "border-white/[.105] bg-[#0d0d0d] text-[#e8e6e1] shadow-[0_1px_0_rgba(255,255,255,.025)_inset] hover:-translate-y-[1px] hover:border-white/[.18] hover:bg-[#151515] hover:text-white active:translate-y-0 active:bg-[#101010]",

        // Strong neutral action used inside operational surfaces.
        secondary:
          "border-white/[.065] bg-[#171717] text-[#dedbd4] shadow-[0_1px_0_rgba(255,255,255,.03)_inset] hover:-translate-y-[1px] hover:border-white/[.12] hover:bg-[#202020] hover:text-white active:translate-y-0",

        // High-value action: subscriptions, Gold, prestige, rewards, special unlocks.
        premium:
          "border-[#d49e08]/55 bg-[#121006] text-[#f6ca43] shadow-[0_0_0_1px_rgba(242,183,5,.025)_inset,0_7px_22px_rgba(242,183,5,.06)] hover:-translate-y-[1px] hover:border-[#e6b329]/75 hover:bg-[#181407] hover:text-[#ffda62] hover:shadow-[0_0_0_1px_rgba(242,183,5,.04)_inset,0_10px_28px_rgba(242,183,5,.10)] active:translate-y-0",

        // Low-emphasis utility action.
        ghost:
          "border-transparent bg-transparent text-[#aaa69e] shadow-none hover:bg-white/[.045] hover:text-[#f1efe9] active:bg-white/[.065]",

        // Very subtle action for dense admin/table contexts.
        quiet:
          "border-white/[.045] bg-white/[.018] text-[#98948d] shadow-none hover:border-white/[.08] hover:bg-white/[.04] hover:text-[#dfdcd5]",

        destructive:
          "border-[#e05252]/28 bg-[#e05252]/[.075] text-[#ff8f8f] shadow-none hover:-translate-y-[1px] hover:border-[#e05252]/45 hover:bg-[#e05252]/[.13] hover:text-[#ffaaaa] active:translate-y-0 active:bg-[#e05252]/[.16] focus-visible:ring-[#e05252]/30",

        link:
          "h-auto rounded-none border-transparent bg-transparent px-0 text-[#e7b928] shadow-none hover:text-[#ffd65c] hover:underline hover:underline-offset-4",
      },
      size: {
        // 44px on mobile-friendly default controls.
        default:
          "h-11 gap-2 px-[18px] sm:h-10 sm:px-4 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-4",
        xs:
          "h-8 gap-1.5 rounded-lg px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm:
          "h-10 gap-1.5 rounded-lg px-3.5 text-[0.8125rem] sm:h-9 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg:
          "h-12 gap-2.5 px-6 text-[0.9375rem] sm:h-11 sm:px-5 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        xl:
          "h-[52px] gap-2.5 px-7 text-base sm:h-12 sm:px-6 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        icon:
          "size-11 rounded-[10px] sm:size-10 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        'icon-xs':
          "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm':
          "size-10 rounded-lg sm:size-9 [&_svg:not([class*='size-'])]:size-4",
        'icon-lg':
          "size-12 rounded-[10px] sm:size-11 [&_svg:not([class*='size-'])]:size-[1.125rem]",
      },
      width: {
        auto: '',
        mobileFull: 'w-full sm:w-auto',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      width: 'auto',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  width = 'auto',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, width, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
