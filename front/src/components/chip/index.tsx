"use client"

import { cn } from "@/utils/cn"
import { Slot } from "radix-ui"
import { type ComponentProps } from "react"

export type ChipProps = ComponentProps<"button"> & {
  asChild?: boolean
  selected?: boolean
}

export function Chip({
  asChild,
  className,
  disabled,
  selected,
  type = "button",
  ...props
}: ChipProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      className={cn(
        "min-h-touch cursor-pointer rounded-lg bg-surface-muted px-3 type-label text-muted transition-colors duration-150 ease-standard hover:bg-surface disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:hover:bg-disabled data-disabled:cursor-not-allowed data-disabled:bg-disabled data-disabled:text-disabled-foreground data-disabled:hover:bg-disabled data-selected:bg-primary data-selected:text-primary-foreground",
        className
      )}
      data-disabled={disabled ? "" : undefined}
      data-selected={selected ? "" : undefined}
      disabled={asChild ? undefined : disabled}
      type={asChild ? undefined : type}
      {...props}
    />
  )
}

Chip.displayName = "Chip"
