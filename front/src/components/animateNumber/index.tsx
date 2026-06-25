"use client"
import { motion, useSpring, useTransform } from "motion/react"
import type { SpringOptions } from "motion/react"
import { memo, useEffect } from "react"

const components = {
  span: motion.span,
  div: motion.div,
  p: motion.p,
} as const

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export type AnimatedNumberProps = {
  readonly value: number
  readonly className?: string
  readonly formatOptions?: Intl.NumberFormatOptions
  readonly springOptions?: SpringOptions
  readonly as?: keyof typeof components
}

export function AnimatedNumber({
  value,
  className,
  formatOptions,
  springOptions,
  as = "span",
}: AnimatedNumberProps) {
  const MotionComponent = components[as]
  const display = getNumberDisplay(value, formatOptions)

  return (
    <MotionComponent
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span className="sr-only">{display.text}</span>
      <span
        aria-hidden="true"
        style={{ alignItems: "baseline", display: "inline-flex" }}
      >
        {display.parts.map((part) => {
          switch (part.kind) {
            case "digit":
              return (
                <Digit
                  key={part.key}
                  springOptions={springOptions}
                  value={Number(part.value)}
                />
              )
            case "static":
              return <span key={part.key}>{part.value}</span>
          }
        })}
      </span>
    </MotionComponent>
  )
}

const Digit = memo(
  function Digit({
    value,
    springOptions,
  }: {
    readonly value: number
    readonly springOptions?: SpringOptions
  }) {
    const spring = useSpring(value, springOptions)
    const y = useTransform(
      spring,
      (current) => `${Math.min(9, Math.max(0, current)) * -1}em`
    )

    useEffect(() => {
      spring.set(value)
    }, [spring, value])

    return (
      <span
        style={{
          display: "inline-block",
          height: "1em",
          lineHeight: 1,
          overflow: "hidden",
        }}
      >
        <motion.span style={{ y, display: "block", lineHeight: 1 }}>
          {digits.map((digit) => (
            <span key={digit} style={{ display: "block", lineHeight: 1 }}>
              {digit}
            </span>
          ))}
        </motion.span>
      </span>
    )
  },
  (prev, next) => prev.value === next.value
)

function getNumberDisplay(
  value: number,
  formatOptions: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
) {
  const text = new Intl.NumberFormat("ko-KR", formatOptions).format(value)
  const characters = Array.from(text)
  const digitCount = characters.filter(isDigit).length
  let seenDigitCount = 0

  const parts = characters.map((character, index) => {
    if (!isDigit(character)) {
      return {
        key: `static-${index}-${character}`,
        kind: "static",
        value: character,
      }
    }

    const place = digitCount - seenDigitCount - 1
    seenDigitCount += 1

    return {
      key: `digit-${place}`,
      kind: "digit",
      value: Number(character),
    }
  })

  return { parts, text }
}

function isDigit(value: string): boolean {
  return value >= "0" && value <= "9"
}
