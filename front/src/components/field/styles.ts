import { tv } from "tailwind-variants"

export const field = tv({
  slots: {
    root: "group/field flex flex-col gap-sm",
    label: "type-label text-muted",
    helper: "px-xs type-label text-muted",
    error: "px-xs type-label font-bold text-tease",
  },
  variants: {
    disabled: {
      true: {
        label: "text-disabled-foreground",
        helper: "text-disabled-foreground",
      },
    },
    invalid: {
      true: {
        label: "text-tease",
      },
    },
  },
})
