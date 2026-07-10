import { Injectable } from "@nestjs/common"
import { ResultAsync, ok } from "neverthrow"
import { MarketService } from "../market/market.service"
import { StocksService } from "../stocks/stocks.service"
import {
  MAX_CANDLE_COUNT,
  type Candle,
  type Candles,
  type CandlesQuery,
} from "./candles.schema"

const KST_TIME_ZONE = "Asia/Seoul"

@Injectable()
export class CandlesService {
  constructor(
    private readonly stocksService: StocksService,
    private readonly marketService: MarketService
  ) {}

  getCandles(query: CandlesQuery) {
    return this.stocksService
      .getBySymbol(query.symbol)
      .asyncAndThen((stock) => {
        const before = query.before ?? kstDate(new Date())

        return ResultAsync.fromSafePromise(
          this.marketService.candles({
            symbol: query.symbol,
            interval: query.interval,
            count: query.count,
            before,
            quotationMarket: stock.quotationMarket,
          })
        )
          .andThen((candles) => candles)
          .map((candles) => {
            const responseCandles = candles.map(toResponseCandle)

            return {
              symbol: query.symbol,
              interval: query.interval,
              candles: responseCandles,
              nextBefore:
                responseCandles.length < query.count
                  ? null
                  : (responseCandles.at(-1)?.timestamp.slice(0, 10) ?? null),
            } satisfies Candles
          })
      })
  }

  async getCandlesFromDate(query: {
    symbol: string
    interval: "1d"
    from: string
  }) {
    const candles: Candle[] = []
    let before: string | undefined

    for (;;) {
      const result = await this.getCandles({
        symbol: query.symbol,
        interval: query.interval,
        before,
        count: MAX_CANDLE_COUNT,
      })

      if (result.isErr()) {
        return result
      }

      candles.push(
        ...result.value.candles.filter(
          (candle) => candle.timestamp.slice(0, 10) >= query.from
        )
      )

      if (
        result.value.nextBefore === null ||
        result.value.candles.some(
          (candle) => candle.timestamp.slice(0, 10) <= query.from
        )
      ) {
        return ok({
          symbol: query.symbol,
          interval: query.interval,
          candles: candles.toReversed(),
          nextBefore: null,
        } satisfies Candles)
      }

      before = result.value.nextBefore
    }
  }
}

function toResponseCandle(candle: {
  readonly date: string
  readonly openPrice: number
  readonly highPrice: number
  readonly lowPrice: number
  readonly closePrice: number
  readonly volume: number
}): Candle {
  return {
    timestamp: `${candle.date}T09:00:00+09:00`,
    openPrice: String(candle.openPrice),
    highPrice: String(candle.highPrice),
    lowPrice: String(candle.lowPrice),
    closePrice: String(candle.closePrice),
    volume: String(candle.volume),
  }
}

function kstDate(date: Date): string {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: KST_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  )

  return `${values.year}-${values.month}-${values.day}`
}
