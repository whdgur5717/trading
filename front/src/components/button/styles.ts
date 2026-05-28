import { tv } from "tailwind-variants"

export const button = tv({
  base: [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm font-semibold tracking-normal whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    "[&_svg]:shrink-0",
  ],
  variants: {
    size: {
      sm: "h-9 px-3 text-caption [&_svg]:size-3.5",
      md: "h-tap px-4 text-label [&_svg]:size-4",
      lg: "h-field px-5 text-body [&_svg]:size-5",
    },
    variant: {
      destructive:
        "bg-danger text-danger-foreground [&:not(:disabled):hover]:bg-danger-hover",
      link: "text-primary underline-offset-2 [&:not(:disabled):hover]:underline",
      primary:
        "bg-primary text-primary-foreground [&:not(:disabled):hover]:bg-primary-hover",
      secondary:
        "bg-secondary text-secondary-foreground [&:not(:disabled):hover]:bg-secondary-hover",
    },
  },
  compoundVariants: [],
  defaultVariants: {
    size: "md",
    variant: "primary",
  },
})
