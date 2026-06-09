"use client"

import { cn } from "@/utils/cn"
import { motion } from "motion/react"

const digitSequence = Array.from({ length: 20 }, (_, index) =>
  String(index % 10)
)

export type RollingNumberProps = {
  value: string
  className?: string
}

type RollingDigitProps = {
  value: string
  order: number
}

function RollingDigit({ value, order }: RollingDigitProps) {
  const targetOffset = 10 + Number(value)

  return (
    <span
      aria-hidden="true"
      className="inline-block overflow-hidden"
      style={{ height: "1em", lineHeight: 1 }}
    >
      <motion.span
        animate={{ y: `-${targetOffset}em` }}
        className="flex flex-col"
        initial={{ y: 0 }}
        transition={{
          delay: Math.min(order * 0.035, 0.18),
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {digitSequence.map((digit, index) => (
          <span
            className="block"
            key={`${digit}-${index}`}
            style={{ height: "1em", lineHeight: 1 }}
          >
            {digit}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export function RollingNumber({ value, className }: RollingNumberProps) {
  let digitOrder = 0

  return (
    <span className={cn("leading-none tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      {Array.from(value).map((character, index) => {
        if (character < "0" || character > "9") {
          return (
            <span aria-hidden="true" key={`${character}-${index}`}>
              {character}
            </span>
          )
        }

        const currentDigitOrder = digitOrder
        digitOrder += 1

        return (
          <RollingDigit
            key={`${value}-${index}`}
            order={currentDigitOrder}
            value={character}
          />
        )
      })}
    </span>
  )
}
