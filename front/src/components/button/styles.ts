import { tv } from "tailwind-variants"

export const button = tv({
  base: [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm font-semibold tracking-normal whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    "[&_svg]:shrink-0",
  ],
  variants: {
    size: {
      sm: "h-9 px-3 text-label [&_svg]:size-3.5",
      md: "h-touch px-4 text-label [&_svg]:size-4",
      lg: "h-14 px-5 text-body [&_svg]:size-5",
    },
    variant: {
      destructive:
        "bg-tease text-tease-foreground [&:not(:disabled):active]:bg-tease/80 [&:not(:disabled):hover]:bg-tease/90",
      link: "text-ink underline-offset-2 [&:not(:disabled):hover]:underline",
      primary:
        "bg-primary text-primary-foreground [&:not(:disabled):active]:bg-primary/80 [&:not(:disabled):hover]:bg-primary/90",
      secondary:
        "bg-accent text-accent-foreground [&:not(:disabled):active]:bg-accent/80 [&:not(:disabled):hover]:bg-accent/90",
    },
  },
  compoundVariants: [],
  defaultVariants: {
    size: "md",
    variant: "primary",
  },
})
