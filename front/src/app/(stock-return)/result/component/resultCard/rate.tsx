"use client"

import { useResultCardContext } from "./context"
import { resultCard } from "./style"

const rateFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
})

type ResultCardRateProps = {
  value: number
}

export function ResultCardRate({ value }: ResultCardRateProps) {
  const { status } = useResultCardContext("ResultCard.Rate")
  const styles = resultCard({ status })
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""

  return (
    <p className={styles.rate()}>
      {sign}
      {rateFormatter.format(Math.abs(value))}%
    </p>
  )
}
