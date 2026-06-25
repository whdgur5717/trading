import { tv } from "tailwind-variants"

export const resultCard = tv({
  slots: {
    amount:
      "flex min-h-15 flex-wrap items-center justify-center type-display tabular-nums",
    badge: "rounded-md px-2.5 py-1 type-label text-bg",
    rate: "type-title wrap-break-word",
  },
  variants: {
    status: {
      flat: {
        amount: "text-warning",
        badge: "bg-warning",
        rate: "text-warning",
      },
      gain: {
        amount: "text-gain",
        badge: "bg-gain",
        rate: "text-gain",
      },
      loss: {
        amount: "text-loss",
        badge: "bg-loss",
        rate: "text-loss",
      },
    },
  },
})
