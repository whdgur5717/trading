import type { ReactNode } from "react"

import { ResultCardAmount } from "./amount"
import { ResultCardBadge } from "./badge"
import { ResultCardStatusProvider } from "./context"
import { ResultCardRate } from "./rate"

export type ResultCardStatus = "gain" | "loss" | "flat"

type ResultCardRootProps = {
  children?: ReactNode
  status: ResultCardStatus
}

function ResultCardRoot({ children, status }: ResultCardRootProps) {
  return (
    <ResultCardStatusProvider status={status}>
      <section className="flex w-full max-w-form flex-col gap-6 rounded-2xl bg-surface-raised p-xl">
        {children}
      </section>
    </ResultCardStatusProvider>
  )
}

type ResultCardSummaryProps = {
  children: ReactNode
}

function ResultCardSummary({ children }: ResultCardSummaryProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-lg type-label text-muted">
      {children}
    </div>
  )
}

type ResultCardSummaryItemProps = {
  label: ReactNode
  value: ReactNode
  caption?: ReactNode
}

function ResultCardSummaryItem({
  caption,
  label,
  value,
}: ResultCardSummaryItemProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="shrink-0 break-keep">{label}</span>
      <span className="min-w-0 text-right wrap-break-word">
        <span className="block text-ink">{value}</span>
        {caption ? (
          <span className="mt-1 block text-subtle">{caption}</span>
        ) : null}
      </span>
    </div>
  )
}

export const ResultCard = Object.assign(ResultCardRoot, {
  Amount: ResultCardAmount,
  Badge: ResultCardBadge,
  Rate: ResultCardRate,
  Summary: ResultCardSummary,
  SummaryItem: ResultCardSummaryItem,
})
