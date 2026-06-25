import { Injectable } from "@nestjs/common"
import { ResultAsync, err, ok } from "neverthrow"
import { CandlesService } from "../candles/candles.service"
import { PricesService } from "../prices/prices.service"
import { StocksService } from "../stocks/stocks.service"
import { calculateReturnResult } from "./returns-calculation"
import type { ReturnSummary } from "./returns.schema"

@Injectable()
export class ReturnsService {
  constructor(
    private readonly candlesService: CandlesService,
    private readonly pricesService: PricesService,
    private readonly stocksService: StocksService
  ) {}

  calculate(symbol: string, buyDate: string, quantity: number) {
    return this.stocksService.getBySymbol(symbol).asyncAndThen((stock) =>
      ResultAsync.combine([
        this.candlesService.getCandles({
          symbol,
          interval: "1d",
          before: buyDate,
          count: 1,
        }),
        this.pricesService.getPrice(symbol),
      ] as const).andThen(([buyCandles, current]) => {
        const buyCandle = buyCandles.candles.find((candle) =>
          candle.timestamp.startsWith(buyDate)
        )

        if (!buyCandle) {
          return err({
            type: "market-data-not-found",
            message: `Market data was not found for ${symbol} on ${buyDate}`,
          })
        }

        const result = calculateReturnResult({
          buyPrice: Number(buyCandle.closePrice),
          currentPrice: Number(current.currentPrice),
          quantity,
        })

        return ok({
          stock,
          buy: {
            date: buyDate,
            price: buyCandle.closePrice,
            quantity,
          },
          current: {
            currentPrice: current.currentPrice,
          },
          result,
        } satisfies ReturnSummary)
      })
    )
  }
}
