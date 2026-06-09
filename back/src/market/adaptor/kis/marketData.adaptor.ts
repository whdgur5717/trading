import { Injectable } from "@nestjs/common"
import { ExternalServiceError } from "../../../common/error/externalServiceError"
import type {
  DailyCandle,
  DailyCandleQuery,
  LastTradingDayCandleQuery,
  MarketDay,
  MarketDayQuery,
  StockQuote,
  StockQuoteQuery,
  TradingDate,
} from "../../port/data"
import type { MarketDataPort } from "../../port/data"
import { quotationMarketCode, rest } from "./protocol"
import { RequestProvider } from "./request.provider"
import {
  dailyCandleSchema,
  lastTradingDayCandleSchema,
  marketDaySchema,
  stockQuoteSchema,
} from "./schema"

@Injectable()
export class MarketDataAdaptor implements MarketDataPort {
  constructor(private readonly requestProvider: RequestProvider) {}

  async stockQuote(query: StockQuoteQuery): Promise<StockQuote> {
    return this.requestProvider.get(
      rest.stockQuote,
      {
        FID_COND_MRKT_DIV_CODE: quotationMarketCode[query.quotationMarket],
        FID_INPUT_ISCD: query.stockCode,
      },
      stockQuoteSchema
    )
  }

  async dailyCandle(query: DailyCandleQuery): Promise<DailyCandle | null> {
    const date = this.compactDate(query.date)

    return this.requestProvider.get(
      rest.dailyCandle,
      {
        FID_COND_MRKT_DIV_CODE: quotationMarketCode[query.quotationMarket],
        FID_INPUT_ISCD: query.stockCode,
        FID_INPUT_DATE_1: date,
        FID_INPUT_DATE_2: date,
        FID_PERIOD_DIV_CODE: "D",
        FID_ORG_ADJ_PRC: "0",
      },
      dailyCandleSchema
    )
  }

  async lastTradingDayCandle(
    query: LastTradingDayCandleQuery
  ): Promise<DailyCandle> {
    const candle = await this.requestProvider.get(
      rest.dailyCandle,
      {
        FID_COND_MRKT_DIV_CODE: quotationMarketCode[query.quotationMarket],
        FID_INPUT_ISCD: query.stockCode,
        FID_INPUT_DATE_1: this.compactDate(
          this.tradingDateDaysBefore(query.asOfDate, 60)
        ),
        FID_INPUT_DATE_2: this.compactDate(query.asOfDate),
        FID_PERIOD_DIV_CODE: "D",
        FID_ORG_ADJ_PRC: "0",
      },
      lastTradingDayCandleSchema
    )

    if (!candle) {
      throw new ExternalServiceError("KIS daily candle is missing", {
        service: "kis",
        kind: "invalidResponse",
        endpoint: rest.dailyCandle.path,
      })
    }

    return candle
  }

  async marketDay(query: MarketDayQuery): Promise<MarketDay> {
    const days = await this.requestProvider.get(
      rest.marketDay,
      {
        BASS_DT: this.compactDate(query.date),
        CTX_AREA_FK: "",
        CTX_AREA_NK: "",
      },
      marketDaySchema(query.quotationMarket)
    )

    const day = days.find((item) => item.date === query.date)

    if (!day) {
      throw new ExternalServiceError("KIS market day is missing", {
        service: "kis",
        kind: "invalidResponse",
        endpoint: rest.marketDay.path,
      })
    }

    return day
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
