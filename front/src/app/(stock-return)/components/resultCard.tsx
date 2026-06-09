import { Button } from "@/components/button"
import { RollingNumber } from "@/components/rollingNumber"
import { WordRotate } from "@/components/wordRotate"
import type { ReturnSummaryDto } from "@/queries/generated"
import { cn } from "@/utils/cn"
import { getReferenceTexts } from "@/utils/references"
import { RotateCcw } from "lucide-react"
import Link from "next/link"
import { dateSeparator, numberFormatter } from "./formatter"

type ResultCardProps = {
  currentPriceCaption?: string
  result: ReturnSummaryDto
  statusLabel?: string
}

const resultVariants = {
  flat: {
    accentClassName: "bg-warning",
    amountClassName: "text-warning",
    label: "본전",
  },
  gain: {
    accentClassName: "bg-gain",
    amountClassName: "text-gain",
    label: "수익",
  },
  loss: {
    accentClassName: "bg-loss",
    amountClassName: "text-loss",
    label: "손실",
  },
} as const

type ResultKind = keyof typeof resultVariants

export function ResultCard({
  currentPriceCaption,
  result,
  statusLabel,
}: ResultCardProps) {
  const resultKind: ResultKind =
    result.result.profit > 0
      ? "gain"
      : result.result.profit < 0
        ? "loss"
        : "flat"
  const resultVariant = resultVariants[resultKind]
  const referenceCopies = getReferenceTexts(
    Math.abs(result.result.profit),
    resultKind
  )
  const profitSign =
    result.result.profit > 0 ? "+" : result.result.profit < 0 ? "-" : ""
  const profitRateSign = result.result.profitRate > 0 ? "+" : ""

  return (
    <section
      className="flex w-full max-w-form flex-col gap-6 rounded-2xl bg-surface-raised p-xl"
      aria-label="계산 결과"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-md px-2.5 py-1 type-label text-bg",
            resultVariant.accentClassName
          )}
        >
          <span className="break-keep">{resultVariant.label}</span>
        </span>
        <span className="flex min-w-0 flex-col items-end gap-1 text-right">
          <span className="type-label wrap-break-word text-muted">
            {result.stock.code}
          </span>
          {statusLabel && (
            <span
              className="type-label wrap-break-word text-subtle"
              aria-live="polite"
            >
              {statusLabel}
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-4 text-center">
        <div className="flex flex-col gap-2">
          <p className="type-label break-keep text-muted">
            {result.stock.name}
          </p>
          <h1 className="type-title break-keep text-ink">
            {result.buy.date.replaceAll("-", dateSeparator)}에 샀다면
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "flex flex-wrap items-center justify-center type-display",
              resultVariant.amountClassName
            )}
          >
            <span className="inline-flex items-center leading-none">
              {profitSign}
            </span>
            <RollingNumber
              className="inline-flex items-center leading-none"
              value={numberFormatter.format(
                Math.abs(Math.round(result.result.profit))
              )}
            />
            <span className="inline-flex items-center leading-none">원</span>
          </p>

          <p
            className={cn(
              "type-title wrap-break-word",
              resultVariant.amountClassName
            )}
          >
            {profitRateSign}
            {result.result.profitRate.toFixed(2)}%
          </p>
        </div>

        {referenceCopies.length > 0 && (
          <WordRotate
            className="mx-auto max-w-full truncate type-body text-ink"
            interval={3500}
            preset="roll-up"
            words={referenceCopies}
          />
        )}
      </div>

      <dl className="flex flex-col gap-2 rounded-xl bg-surface-muted p-lg type-label text-muted">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 break-keep">그때 한 주 가격</dt>
          <dd className="min-w-0 text-right wrap-break-word text-ink">
            {numberFormatter.format(Math.round(result.buy.price))}원
          </dd>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 break-keep">고른 수량</dt>
          <dd className="min-w-0 text-right wrap-break-word text-ink">
            {numberFormatter.format(result.buy.quantity)}주
          </dd>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 break-keep">그때 필요했던 돈</dt>
          <dd className="min-w-0 text-right wrap-break-word text-ink">
            {numberFormatter.format(Math.round(result.result.buyAmount))}원
          </dd>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 break-keep">지금 주식 값</dt>
          <dd className="min-w-0 text-right wrap-break-word">
            <span className="block text-ink">
              {numberFormatter.format(Math.round(result.result.currentValue))}원
            </span>
            {currentPriceCaption && (
              <span className="mt-1 block text-subtle">
                {currentPriceCaption}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <Button asChild className="w-full rounded-md" variant="secondary">
        <Link href="/">
          <RotateCcw className="size-4" />
          다시 계산하기
        </Link>
      </Button>
    </section>
  )
}
