import { tv } from "tailwind-variants"

export const modal = tv({
  slots: {
    overlay:
      "fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-fade-in",
    content:
      "fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-11/12 max-w-form flex-col overflow-hidden rounded-2xl bg-surface-raised text-ink outline-none data-[state=open]:animate-fade-in",
    header: "flex flex-col gap-2 bg-surface px-xl py-5",
    title: "type-title text-ink",
    description: "text-body text-muted",
    body: "min-h-0 overflow-auto px-xl py-5 text-body text-ink",
    footer:
      "flex flex-col-reverse gap-2 bg-surface px-xl py-4 sm:flex-row sm:justify-end",
    closeButton:
      "absolute top-4 right-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:hover:bg-transparent disabled:hover:text-disabled-foreground [&_svg]:size-4",
  },
})
