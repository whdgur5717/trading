"use client"

import { ResultCardAmount } from "./amount"
import { ResultCardRate } from "./rate"

type ResultCardValueProps = {
  profit: number
  rate: number
}

export function ResultCardValue({ profit, rate }: ResultCardValueProps) {
  return (
    <>
      <ResultCardAmount value={profit} />
      <ResultCardRate value={rate} />
    </>
  )
}
