"use client"

import { ResultCard } from "./resultCard"
import { dateSeparator, numberFormatter } from "./formatter"
import {
  RealtimeErrorDtoSchema,
  RealtimeHeartbeatDtoSchema,
  RealtimePriceDtoSchema,
  RealtimeReconnectedDtoSchema,
  RealtimeSubscribedDtoSchema,
  type ReturnSummaryDto,
} from "@/queries/generated"
import { useEventStream } from "@/queries/useEventStream"

const events = {
  heartbeat(data: unknown) {
    RealtimeHeartbeatDtoSchema.parse(data)
    return null
  },
  price(data: unknown) {
    return RealtimePriceDtoSchema.parse(data)
  },
  reconnected(data: unknown) {
    RealtimeReconnectedDtoSchema.parse(data)
    return null
  },
  subscribed(data: unknown) {
    RealtimeSubscribedDtoSchema.parse(data)
    return null
  },
}

function readError(data: unknown) {
  const result = RealtimeErrorDtoSchema.safeParse(data)

  if (!result.success) {
    return null
  }

  return {
    message: result.data.message,
    retryAfterMs: result.data.retryAfterMs,
  }
}

function formatDate(value: string) {
  return value.replaceAll("-", dateSeparator)
}

function formatTradeTime(value: string) {
  if (value.length !== 6) {
    return value
  }

  return `${value.slice(0, 2)}:${value.slice(2, 4)}:${value.slice(4)}`
}

function calculateResult(result: ReturnSummaryDto, currentPrice: number) {
  const currentValue = currentPrice * result.buy.quantity
  const profit = currentValue - result.result.buyAmount
  const profitRate =
    result.result.buyAmount === 0
      ? 0
      : Number(((profit / result.result.buyAmount) * 100).toFixed(2))

  return {
    ...result,
    current: {
      ...result.current,
      price: currentPrice,
    },
    result: {
      ...result.result,
      currentValue,
      profit,
      profitRate,
    },
  }
}

export function LiveResultCard({ result }: { result: ReturnSummaryDto }) {
  const canStream = result.current.basis.type === "current-snapshot"
  const stream = useEventStream({
    enabled: canStream,
    events,
    readError,
    url: `/api/realtime/stream?stockCodes=${encodeURIComponent(result.stock.code)}`,
  })
  const summary =
    stream.data === null ? result : calculateResult(result, stream.data.price)

  let statusLabel = "실시간 연결 중"
  let currentPriceCaption =
    result.current.basis.type === "latest-close"
      ? `현재가 ${numberFormatter.format(Math.round(result.current.price))}원 · ${formatDate(result.current.basis.tradingDate)} 종가 기준`
      : `현재가 ${numberFormatter.format(Math.round(result.current.price))}원 · 계산 시점 기준`

  if (!canStream) {
    statusLabel = "종가 기준"
  } else if (stream.status === "open" && stream.data === null) {
    statusLabel = "거래 수신 대기"
  } else if (stream.status === "open" && stream.data !== null) {
    const updatedAt = formatTradeTime(stream.data.tradeTime)

    statusLabel = `실시간 반영 중 · ${updatedAt}`
    currentPriceCaption = `현재가 ${numberFormatter.format(Math.round(stream.data.price))}원 · ${updatedAt} 갱신`
  } else if (stream.status === "stale" && stream.data !== null) {
    const updatedAt = formatTradeTime(stream.data.tradeTime)

    statusLabel = `최근가 기준 · 마지막 ${updatedAt}`
    currentPriceCaption = `현재가 ${numberFormatter.format(Math.round(stream.data.price))}원 · 마지막 ${updatedAt}`
  } else if (stream.status === "stale") {
    statusLabel = "거래 수신 대기"
  } else if (stream.status === "error") {
    statusLabel = stream.data === null ? "실시간 잠시 중단" : "최근가 기준"
  }

  return (
    <ResultCard
      currentPriceCaption={currentPriceCaption}
      result={summary}
      statusLabel={statusLabel}
    />
  )
}
