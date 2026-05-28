import { tv } from "tailwind-variants"

export const calendar = tv({
  slots: {
    root: "flex flex-col overflow-hidden rounded-xl bg-transparent text-primary",
    header: "flex items-center justify-between px-1 pb-3",
    title: "text-label font-bold text-primary",
    navButton:
      "flex size-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:opacity-40 disabled:hover:bg-transparent [&_svg]:size-4",
    weekday:
      "grid grid-cols-7 gap-1 px-1 pb-2 text-center text-caption font-bold text-muted",
    daysGrid: "w-full border-separate border-spacing-1",
    weekRow: "",
    dayCell:
      "mx-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-label font-bold text-primary transition-colors duration-150 ease-standard hover:bg-surface-hover active:opacity-60 disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:hover:bg-transparent disabled:active:opacity-100 data-selected:bg-primary data-selected:text-primary-foreground data-[hidden=true]:invisible data-[outside-month=true]:text-subtle",
  },
})
