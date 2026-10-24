import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// iOS button styles (HIG Buttons): filled, tinted, gray, plain and glass, as capsules with a spring press.
// `outline`, `secondary`, `ghost` and `link` are kept as aliases for older call sites.
const buttonVariants = cva(
  "pressable inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        tinted: "bg-[color-mix(in_oklab,var(--tint)_15%,transparent)] text-primary",
        gray: "bg-fill text-primary",
        plain: "text-primary",
        glass: "glass text-foreground",
        destructive: "bg-[color-mix(in_oklab,var(--system-red)_12%,transparent)] text-destructive",
        outline: "bg-fill text-primary",
        secondary: "bg-[color-mix(in_oklab,var(--tint)_15%,transparent)] text-primary",
        ghost: "text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 type-subhead",
        default: "h-11 px-5 type-body",
        lg: "h-[50px] px-6 type-body",
        icon: "size-11",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
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
