import { Injectable } from "@nestjs/common"
import { KisService } from "../kis/kis.service"
import { StocksService } from "../stocks/stocks.service"
import type {
  PriceCurrent,
  PriceDailyCandle,
  PriceQuote,
} from "./prices.schema"

const UNIFIED_MARKET_CODE = "UN"
const UNIFIED_MARKET_CLOSE_TIME = "200000"
const KST_TIME_ZONE = "Asia/Seoul"

function toKstClock(date: Date) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: KST_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  )

  return {
    date: `${values.year}${values.month}${values.day}`,
    time: `${values.hour}${values.minute}${values.second}`,
    requestedAt: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`,
  }
}

@Injectable()
export class PricesService {
  constructor(
    private readonly stocksService: StocksService,
    private readonly kisService: KisService
  ) {}

  async getQuote(code: string): Promise<PriceQuote> {
    const stock = this.stocksService.getByCode(code)
    const price = await this.kisService.getCurrentPrice(
      code,
      stock.kisMarketCode
    )

    return {
      stock,
      marketCode: stock.kisMarketCode,
      price,
    }
  }

  async getDailyCandle(code: string, date: string): Promise<PriceDailyCandle> {
    const stock = this.stocksService.getByCode(code)
    const result = await this.kisService.getDailyPrice(
      code,
      date,
      stock.kisMarketCode
    )

    return {
      stock,
      requestedDate: date,
      marketCode: stock.kisMarketCode,
      ...result,
    }
  }

  async getCurrentPrice(code: string, now = new Date()): Promise<PriceCurrent> {
    this.stocksService.getByCode(code)

    const clock = toKstClock(now)
    const marketDay = await this.kisService.getDomesticMarketDay(clock.date)

    if (marketDay.isOpenDay && clock.time < UNIFIED_MARKET_CLOSE_TIME) {
      const current = await this.kisService.getCurrentPrice(
        code,
        UNIFIED_MARKET_CODE
      )

      return {
        price: current.currentPrice,
        source: "kis-rest-current-price",
        marketCode: UNIFIED_MARKET_CODE,
        basis: {
          type: "current-snapshot",
          requestedAt: clock.requestedAt,
        },
      }
    }

    const close = await this.kisService.getLatestDailyClose(
      code,
      clock.date,
      UNIFIED_MARKET_CODE
    )

    return {
      price: close.closePrice,
      source: "kis-rest-daily-itemchartprice",
      marketCode: UNIFIED_MARKET_CODE,
      basis: {
        type: "latest-close",
        tradingDate: close.date,
      },
    }
  }
}
