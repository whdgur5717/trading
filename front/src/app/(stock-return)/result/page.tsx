import { RETURNS_CONTROLLER_CALCULATE } from "@/queries/generated"
import { stockReturnSearchParamsCache } from "./searchParams"
import { numberFormatter } from "../components/formatter"
import { ResultCard } from "./component/resultCard"
import { ResultCardValue } from "./component/resultCard/value"

export default async function ResultPage({
  searchParams,
}: PageProps<"/result">) {
  const { code, buyDate, quantity } =
    await stockReturnSearchParamsCache.parse(searchParams)

  const result = await RETURNS_CONTROLLER_CALCULATE({
    symbol: code,
    buyDate,
    quantity,
  }).match(
    (response) => response.body.data,
    (response) => {
      throw response
    }
  )

  const profit = result.result.currentValue - result.result.buyAmount
  const status = profit > 0 ? "gain" : profit < 0 ? "loss" : "flat"
  const buyDateLabel = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${result.buy.date}T00:00:00+09:00`))

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
        <ResultCardValue result={result} />
      </div>
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
          value={`${numberFormatter.format(Math.round(result.result.currentValue))}원`}
          caption={`현재가 ${numberFormatter.format(Math.round(Number(result.current.currentPrice)))}원`}
        />
      </ResultCard.Summary>
    </ResultCard>
  )
}
