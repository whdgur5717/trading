import { tv } from "tailwind-variants"

export const autocomplete = tv({
  slots: {
    search: "grid gap-sm",
    label: "type-label text-muted",
    inputGroup:
      "group grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1 rounded-xl bg-surface-muted px-4 py-3 text-left font-sans text-ink transition-colors duration-150 ease-standard outline-none focus-within:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent hover:bg-surface data-disabled:cursor-not-allowed data-disabled:bg-disabled data-disabled:text-disabled-foreground data-invalid:outline-2 data-invalid:outline-offset-2 data-invalid:outline-tease data-popup-open:bg-surface-raised",
    input:
      "min-w-0 bg-transparent p-0 type-body text-ink outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:placeholder:text-disabled-foreground",
    action:
      "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:hover:bg-transparent disabled:hover:text-disabled-foreground data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground data-disabled:hover:bg-transparent data-disabled:hover:text-disabled-foreground [&_svg]:size-4",
    positioner: "z-50 outline-none",
    content:
      "z-50 w-(--anchor-width) max-w-(--available-width) rounded-2xl bg-[oklch(0.245_0.02_294)] p-3 text-ink shadow-[0_18px_44px_oklch(0_0_0/0.34)] outline-none data-open:animate-popover-in",
    results: "grid gap-1",
    viewport: "grid gap-1",
    list: "grid max-h-[min(18rem,var(--available-height))] min-h-12.5 scroll-py-3 gap-1 overflow-y-auto overscroll-contain data-empty:p-0",
    item: "group grid min-h-18 w-full cursor-pointer content-center gap-1 rounded-lg px-3 py-2.5 text-left font-sans text-body font-semibold text-ink transition-colors duration-150 ease-standard outline-none select-none data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground data-highlighted:bg-surface-muted data-highlighted:text-ink data-selected:bg-primary data-selected:text-primary-foreground",
    itemTitle: "font-bold",
    itemDescription:
      "type-label text-muted transition-colors duration-150 ease-standard group-data-highlighted:text-muted group-data-selected:text-primary-foreground/60",
    status: "min-h-18 px-3 py-4 text-label font-bold text-muted",
    empty: "min-h-18 px-3 py-4 text-label font-bold text-muted",
    group: "grid gap-1",
    groupLabel: "px-3 py-2 type-label text-muted",
    separator: "my-1 h-px bg-surface-muted",
  },
})
