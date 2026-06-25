"use client"

import { AnimatedNumber } from "@/components/animateNumber"

import { displayRules } from "../../../components/formatter"
import { useResultCardContext } from "./context"
import { resultCard } from "./style"

type ResultCardAmountProps = {
  value: number
}

export function ResultCardAmount({ value }: ResultCardAmountProps) {
  const { status } = useResultCardContext("ResultCard.Amount")
  const styles = resultCard({ status })
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  const absoluteValue = Math.abs(Math.round(value))
  const rule = displayRules.find(({ minValue }) => absoluteValue >= minValue)!

  return (
    <p className={styles.amount()}>
      <span className="inline-flex items-center leading-none">{sign}</span>
      <AnimatedNumber
        className="inline-flex items-center leading-none"
        formatOptions={{ maximumFractionDigits: rule.maximumFractionDigits }}
        value={absoluteValue / rule.divisor}
      />
      <span className="inline-flex items-center leading-none">
        {rule.suffix}
      </span>
    </p>
  )
}
