"use client"

import type { ReturnChartDto } from "@/queries/generated"
import { useEventStream } from "@/queries/useEventStream"
import {
  PriceTrendChart,
  type PriceTrendData,
} from "@/components/priceTrendChart"
import { useMemo } from "react"

import { numberFormatter } from "../../components/formatter"
import { ResultCard, type ResultCardStatus } from "./resultCard"
import { ResultCardValue } from "./resultCard/value"

type ResultViewProps = {
  result: ReturnChartDto
}

function statusOf(value: number): ResultCardStatus {
  return value > 0 ? "gain" : value < 0 ? "loss" : "flat"
}

function chartDate(value: string | undefined) {
  if (!value) {
    return undefined
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  if (!/^\d{8}$/.test(value)) {
    return undefined
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

export function ResultView({ result }: ResultViewProps) {
  const stream = useEventStream(result.stock.symbol)
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

    const time = chartDate(stream.data?.businessDate)

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
