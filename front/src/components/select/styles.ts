import { tv } from "tailwind-variants"

export const select = tv({
  slots: {
    trigger:
      "inline-flex min-w-0 cursor-pointer items-center justify-between gap-sm rounded-lg bg-surface-muted text-ink transition-colors duration-150 ease-standard outline-none hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground data-disabled:cursor-not-allowed data-disabled:bg-disabled data-disabled:text-disabled-foreground data-placeholder:text-subtle data-popup-open:bg-surface-raised",
    value: "min-w-0 truncate data-placeholder:text-subtle",
    icon: "flex shrink-0 items-center justify-center text-muted transition-transform duration-150 ease-standard data-popup-open:rotate-180 [&_svg]:shrink-0",
    positioner: "z-50 outline-none",
    popup:
      "relative min-w-(--anchor-width) rounded-lg bg-surface-raised text-ink shadow-[0_18px_44px_oklch(0_0_0/0.34)] outline-none data-open:animate-popover-in",
    list: "grid max-h-[inherit] gap-1 overflow-y-auto overscroll-contain p-1",
    item: "group flex cursor-pointer items-center justify-between gap-sm rounded-md text-ink transition-colors duration-150 ease-standard outline-none select-none data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground data-highlighted:bg-surface-muted data-selected:bg-primary data-selected:text-primary-foreground",
    itemText: "min-w-0 truncate",
    itemIndicator:
      "flex shrink-0 items-center justify-center text-primary transition-colors duration-150 ease-standard group-data-selected:text-primary-foreground",
    group: "grid gap-1",
    groupLabel: "px-sm py-xs type-label text-muted",
    separator: "my-1 h-px bg-surface-muted",
    scrollUpFade:
      "pointer-events-none inset-x-0 top-0 z-10 h-4 rounded-t-lg bg-linear-to-b from-surface-raised/55 to-transparent opacity-0 transition-opacity duration-150 ease-standard data-visible:opacity-100",
    scrollDownFade:
      "pointer-events-none inset-x-0 bottom-0 z-10 h-4 rounded-b-lg bg-linear-to-t from-surface-raised/55 to-transparent opacity-0 transition-opacity duration-150 ease-standard data-visible:opacity-100",
    scrollArrow:
      "flex items-center justify-center text-muted data-visible:animate-fade-in [&_svg]:size-4",
  },
})
