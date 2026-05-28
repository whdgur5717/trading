import { cn } from "@/utils/cn"
import { Slot } from "radix-ui"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef } from "react"
import type { VariantProps } from "tailwind-variants"

import { button } from "./styles"

export type ButtonVariantProps = VariantProps<typeof button>

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean
} & ButtonVariantProps

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, className, size, variant, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button"

    return (
      <Comp
        ref={ref}
        className={cn(button({ size, variant }), className)}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
