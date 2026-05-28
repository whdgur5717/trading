import { Button } from "@/components/button"
import type { ReturnSummaryDto } from "@/queries/generated"
import { cn } from "@/utils/cn"

type ResultCardProps = {
  result: ReturnSummaryDto
}

function formatDate(value: string) {
  return value.replaceAll("-", ".")
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <section
      className="grid gap-5 rounded-2xl bg-surface-raised p-panel shadow-panel"
      aria-label="계산 결과"
    >
      <p className="text-body font-semibold text-secondary">
        {formatDate(result.buy.date)}에 {result.stock.name}에
        <br />
        {result.buy.quantity.toLocaleString("ko-KR")}주를 샀다면
      </p>
      <div className="grid gap-1">
        <span className="text-caption font-extrabold text-muted">지금</span>
        <strong className="text-display font-extrabold tracking-normal text-primary">
          {formatWon(result.result.currentValue)}
        </strong>
      </div>
      <div className="flex flex-wrap gap-2 text-body-lg font-extrabold text-muted">
        <span
          className={cn(
            result.result.profit >= 0 ? "text-profit" : "text-loss"
          )}
        >
          {formatWon(result.result.profit)} (
          {result.result.profitRate.toFixed(2)}%)
        </span>
      </div>
      <dl className="grid gap-2">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted px-4 py-3">
          <dt className="text-label font-bold text-muted">당시 기준가</dt>
          <dd className="text-label font-extrabold text-primary">
            {formatWon(result.buy.price)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted px-4 py-3">
          <dt className="text-label font-bold text-muted">현재 기준가</dt>
          <dd className="text-label font-extrabold text-primary">
            {formatWon(result.current.price)}
          </dd>
        </div>
      </dl>
      <Button size="lg">결과 공유하기</Button>
    </section>
  )
}
