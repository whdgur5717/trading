"use client"
import { cn } from "@/utils/cn"
import { motion, SpringOptions, useSpring, useTransform } from "motion/react"
import { useEffect } from "react"

const components = {
  span: motion.span,
  div: motion.div,
  p: motion.p,
} as const

export type AnimatedNumberProps = {
  value: number
  className?: string
  springOptions?: SpringOptions
  as?: keyof typeof components
}

export function AnimatedNumber({
  value,
  className,
  springOptions,
  as = "span",
}: AnimatedNumberProps) {
  const MotionComponent = components[as]

  const spring = useSpring(0, springOptions)
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  )

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <MotionComponent className={cn("tabular-nums", className)}>
      {display}
    </MotionComponent>
  )
}
