import { tv } from "tailwind-variants"

export const statusIndicator = tv({
  slots: {
    root: "inline-flex min-w-0 items-center gap-sm align-middle type-label",
    marker: "relative grid shrink-0 place-items-center rounded-pill",
    halo: "absolute rounded-pill motion-reduce:animate-none",
    dot: "relative rounded-pill",
    label: "min-w-0 wrap-break-word",
  },
  variants: {
    size: {
      sm: {
        marker: "size-4",
        halo: "size-4",
        dot: "size-2",
      },
      md: {
        marker: "size-6",
        halo: "size-6",
        dot: "size-2",
      },
      lg: {
        marker: "size-8",
        halo: "size-8",
        dot: "size-3",
      },
    },
    variant: {
      active: {
        marker: "bg-success/15",
        halo: "animate-status-pulse bg-success/30",
        dot: "bg-success",
        label: "text-muted",
      },
      danger: {
        halo: "bg-tease/15",
        dot: "bg-tease",
        label: "text-tease",
      },
      idle: {
        halo: "bg-accent/15",
        dot: "bg-accent",
        label: "text-muted",
      },
      inactive: {
        halo: "bg-disabled",
        dot: "bg-disabled-foreground",
        label: "text-subtle",
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "inactive",
  },
})
