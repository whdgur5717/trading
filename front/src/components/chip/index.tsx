"use client"

import { Slot } from "radix-ui"
import { type ComponentProps } from "react"

export type ChipProps = ComponentProps<"button"> & {
  asChild?: boolean
  selected?: boolean
}

export function Chip({
  asChild,
  disabled,
  selected,
  type = "button",
  ...props
}: ChipProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-disabled={disabled ? "" : undefined}
      data-selected={selected ? "" : undefined}
      disabled={asChild ? undefined : disabled}
      type={asChild ? undefined : type}
      {...props}
    />
  )
}

Chip.displayName = "Chip"
