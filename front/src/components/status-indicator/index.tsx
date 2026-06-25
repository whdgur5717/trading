import { cn } from "@/utils/cn"
import type { ComponentProps } from "react"
import type { VariantProps } from "tailwind-variants"

import { statusIndicator } from "./styles"

export type StatusIndicatorVariantProps = VariantProps<typeof statusIndicator>
export type StatusIndicatorVariant = NonNullable<
  StatusIndicatorVariantProps["variant"]
>

export type StatusIndicatorProps = Omit<ComponentProps<"span">, "children"> &
  StatusIndicatorVariantProps & {
    label?: string
  }

export function StatusIndicator({
  className,
  label,
  size,
  variant,
  ...props
}: StatusIndicatorProps) {
  const styles = statusIndicator({ size, variant })

  return (
    <span className={cn(styles.root(), className)} {...props}>
      <span className={styles.marker()}>
        <span className={styles.halo()} />
        <span className={styles.dot()} />
      </span>
      {label ? <span className={styles.label()}>{label}</span> : null}
    </span>
  )
}

StatusIndicator.displayName = "StatusIndicator"
