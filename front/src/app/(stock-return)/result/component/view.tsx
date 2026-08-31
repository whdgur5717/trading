"use client"

import type { ReturnChartDto } from "@/queries/generated"
import { useEventStream } from "@/queries/useEventStream"
import { Button } from "@/components/button"
import {
  PriceTrendChart,
  type PriceTrendData,
} from "@/components/priceTrendChart"
import { StatusIndicator } from "@/components/status-indicator"
import { useMemo } from "react"

import { numberFormatter } from "../../components/formatter"
import { ResultCard, type ResultCardStatus } from "./resultCard"
import { ResultCardValue } from "./resultCard/value"

type ResultViewProps = {
  result: ReturnChartDto
}

const marketSessions = {
  PRE_MARKET: { label: "프리마켓(장개시전 시간외시장)", variant: "active" },
  REGULAR_MARKET: { label: "정규장(정규시장)", variant: "active" },
  AFTER_MARKET: {
    label: "애프터마켓(장종료후 시간외시장)",
    variant: "active",
  },
  CLOSED: { label: "종료", variant: "inactive" },
  UNKNOWN: { label: "확인 중", variant: "inactive" },
  UNAVAILABLE: { label: "확인 불가", variant: "danger" },
} as const

function statusOf(value: number): ResultCardStatus {
  return value > 0 ? "gain" : value < 0 ? "loss" : "flat"
}

export function ResultView({ result }: ResultViewProps) {
  const stream = useEventStream(result.stock.symbol)
  const marketSessionUnavailable =
    stream.error !== null &&
    "code" in stream.error &&
    stream.error.code.startsWith("MARKET_SESSION_")
  const marketSession =
    marketSessions[
      marketSessionUnavailable
        ? "UNAVAILABLE"
        : (stream.marketSession ?? "UNKNOWN")
    ]
  const currentPrice = stream.data?.price ?? Number(result.current.currentPrice)
  const currentValue = currentPrice * result.buy.quantity
  const profit = currentValue - result.result.buyAmount
  const rate =
    result.result.buyAmount === 0 ? 0 : (profit / result.result.buyAmount) * 100
  const status = statusOf(profit)
  const buyDateLabel = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${result.buy.date}T00:00:00+09:00`))
  const chartData = useMemo(() => {
    const data = result.chart.candles.map((candle) => ({
      time: candle.timestamp.slice(0, 10),
      value: Number(candle.closePrice),
    })) satisfies PriceTrendData[]

    const time = stream.data?.executedAt.slice(0, 10)

    if (!time || stream.data?.price === undefined) {
      return data
    }

    const current = {
      time,
      value: stream.data.price,
    } satisfies PriceTrendData
    const existingIndex = data.findIndex((point) => point.time === current.time)

    if (existingIndex >= 0) {
      return data.map((point, index) =>
        index === existingIndex ? current : point
      )
    }

    return [...data, current].sort((left, right) =>
      String(left.time).localeCompare(String(right.time))
    )
  }, [result.chart.candles, stream.data])
  const currentChartPoint = chartData.at(-1)

  return (
    <ResultCard status={status}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-sm">
          <StatusIndicator
            label={marketSession.label}
            size="sm"
            variant={marketSession.variant}
          />
          {marketSessionUnavailable ? (
            <Button size="sm" variant="link" onClick={stream.reconnect}>
              다시 시도
            </Button>
          ) : null}
        </div>
        <p className="text-center type-body text-muted">
          <span className="font-semibold text-ink">{buyDateLabel}</span> 종가에{" "}
          <span className="font-semibold text-primary">
            {result.stock.name}
          </span>
          를 샀다면
        </p>
        <ResultCardValue profit={profit} rate={rate} />
      </div>
      <PriceTrendChart data={chartData}>
        {currentChartPoint ? (
          <PriceTrendChart.Marker point={currentChartPoint}>
            <span className="relative flex size-4 -translate-1/2 items-center justify-center">
              <span className="absolute size-4 rounded-full bg-primary/35 motion-safe:animate-ping" />
              <span className="relative size-2 rounded-full bg-primary ring-2 ring-bg" />
            </span>
          </PriceTrendChart.Marker>
        ) : null}
      </PriceTrendChart>
      <ResultCard.Summary>
        <ResultCard.SummaryItem
          label="매수가"
          value={`${numberFormatter.format(Math.round(Number(result.buy.price)))}원`}
        />
        <ResultCard.SummaryItem
          label="수량"
          value={`${numberFormatter.format(result.buy.quantity)}주`}
        />
        <ResultCard.SummaryItem
          label="매수 금액"
          value={`${numberFormatter.format(Math.round(result.result.buyAmount))}원`}
        />
        <ResultCard.SummaryItem
          label="현재 평가액"
          value={`${numberFormatter.format(Math.round(currentValue))}원`}
          caption={`현재가 ${numberFormatter.format(Math.round(currentPrice))}원`}
        />
      </ResultCard.Summary>
    </ResultCard>
  )
}
