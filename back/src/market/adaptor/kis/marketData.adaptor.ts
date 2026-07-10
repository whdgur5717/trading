import { Injectable } from "@nestjs/common"
import { err, ok, type Result } from "neverthrow"
import { marketErrors, type MarketDataError } from "../../market-data.error"
import type {
  Candle,
  CandlesQuery,
  MarketDay,
  MarketDayQuery,
  Price,
  PriceQuery,
  TradingDate,
} from "../../port/data"
import { quotationMarketCode, rest } from "./protocol"
import { RequestProvider } from "./request.provider"
import { candlesSchema, marketDaySchema, priceSchema } from "./schema"

@Injectable()
export class KisMarketDataAdaptor {
  constructor(private readonly requestProvider: RequestProvider) {}

  price(query: PriceQuery): Promise<Result<Price, MarketDataError>> {
    return this.requestProvider.get(
      rest.price,
      {
        FID_COND_MRKT_DIV_CODE: quotationMarketCode[query.quotationMarket],
        FID_INPUT_ISCD: query.symbol,
      },
      priceSchema
    )
  }

  async candles(
    query: CandlesQuery
  ): Promise<Result<Candle[], MarketDataError>> {
    const startDate = this.tradingDateDaysBefore(
      query.before,
      Math.max(30, query.count * 3)
    )
    const candles = await this.requestProvider.get(
      rest.candles,
      {
        FID_COND_MRKT_DIV_CODE: quotationMarketCode[query.quotationMarket],
        FID_INPUT_ISCD: query.symbol,
        FID_INPUT_DATE_1: this.compactDate(startDate),
        FID_INPUT_DATE_2: this.compactDate(query.before),
        FID_PERIOD_DIV_CODE: "D",
        FID_ORG_ADJ_PRC: "0",
      },
      candlesSchema
    )

    return candles.map((items) =>
      items
        .filter((candle) => candle.date <= query.before)
        .slice(0, query.count)
    )
  }

  async marketDay(
    query: MarketDayQuery
  ): Promise<Result<MarketDay, MarketDataError>> {
    const days = await this.requestProvider.get(
      rest.marketDay,
      {
        BASS_DT: this.compactDate(query.date),
        CTX_AREA_FK: "",
        CTX_AREA_NK: "",
      },
      marketDaySchema(query.quotationMarket)
    )

    if (days.isErr()) {
      return err(days.error)
    }

    const day = days.value.find((item) => item.date === query.date)

    if (!day) {
      return err(
        marketErrors.dataNotFound({
          provider: "kis",
          endpoint: rest.marketDay.path,
          upstreamStatus: null,
          upstreamCode: null,
        })
      )
    }

    return ok(day)
  }

  private compactDate(date: TradingDate): string {
    return date.replaceAll("-", "")
  }

  private tradingDateDaysBefore(date: TradingDate, days: number): TradingDate {
    const value = new Date(`${date}T00:00:00.000Z`)
    value.setUTCDate(value.getUTCDate() - days)

    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, "0"),
      String(value.getUTCDate()).padStart(2, "0"),
    ].join("-")
  }
}
