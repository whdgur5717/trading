import { tv } from "tailwind-variants"

export const input = tv({
  slots: {
    root: "group/input grid min-h-touch w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-x-md gap-y-xs rounded-lg bg-surface-muted px-lg py-md text-left text-ink outline-none group-data-disabled/field:cursor-not-allowed group-data-disabled/field:bg-disabled group-data-disabled/field:text-disabled-foreground group-data-invalid/field:outline-2 group-data-invalid/field:outline-offset-2 group-data-invalid/field:outline-tease focus-within:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent group-data-disabled/field:focus-within:bg-disabled group-data-disabled/field:focus-within:outline-none group-data-invalid/field:focus-within:outline-tease",
    control:
      "min-w-0 bg-transparent p-0 type-body text-ink outline-none placeholder:text-subtle",
    trailing:
      "flex items-end gap-sm pb-xs text-label text-muted group-data-disabled/field:text-disabled-foreground group-data-invalid/field:text-tease [&_svg]:size-4 [&_svg]:shrink-0",
  },
  variants: {
    disabled: {
      true: {
        root: "cursor-not-allowed bg-disabled text-disabled-foreground focus-within:bg-disabled focus-within:outline-none",
        control:
          "cursor-not-allowed text-disabled-foreground placeholder:text-disabled-foreground",
        trailing: "text-disabled-foreground",
      },
    },
  },
})
