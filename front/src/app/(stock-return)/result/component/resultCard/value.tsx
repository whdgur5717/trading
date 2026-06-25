"use client"

import type { ReturnSummaryDto } from "@/queries/generated"
import { useEventStream } from "@/queries/useEventStream"

import type { ResultCardStatus } from "."
import { ResultCardAmount } from "./amount"
import { ResultCardStatusProvider } from "./context"
import { ResultCardRate } from "./rate"

type ResultCardValueProps = {
  result: ReturnSummaryDto
}

function statusOf(value: number): ResultCardStatus {
  return value > 0 ? "gain" : value < 0 ? "loss" : "flat"
}

export function ResultCardValue({ result }: ResultCardValueProps) {
  const stream = useEventStream(result.stock.symbol)
  const currentPrice = stream.data?.price ?? Number(result.current.currentPrice)
  const profit = currentPrice * result.buy.quantity - result.result.buyAmount
  const rate =
    result.result.buyAmount === 0 ? 0 : (profit / result.result.buyAmount) * 100

  return (
    <ResultCardStatusProvider status={statusOf(profit)}>
      <ResultCardAmount value={profit} />
      <ResultCardRate value={rate} />
    </ResultCardStatusProvider>
  )
}
