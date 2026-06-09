import { Inject, Injectable } from "@nestjs/common"
import { MARKET_DATA_PORT, type MarketDataPort } from "../market/port/data"
import { StocksService } from "../stocks/stocks.service"
import type {
  PriceCurrent,
  PriceDailyCandle,
  PriceQuote,
} from "./prices.schema"

const UNIFIED_QUOTATION_MARKET = "CONSOLIDATED"
const UNIFIED_MARKET_CLOSE_TIME = "200000"
const KST_TIME_ZONE = "Asia/Seoul"

function kstClock(date: Date) {
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
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}${values.minute}${values.second}`,
    requestedAt: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`,
  }
}

@Injectable()
export class PricesService {
  constructor(
    private readonly stocksService: StocksService,
    @Inject(MARKET_DATA_PORT) private readonly marketData: MarketDataPort
  ) {}

  async getQuote(code: string): Promise<PriceQuote> {
    const stock = this.stocksService.getByCode(code)
    const price = await this.marketData.stockQuote({
      stockCode: code,
      quotationMarket: stock.quotationMarket,
    })

    return {
      stock,
      quotationMarket: stock.quotationMarket,
      price,
    }
  }

  async getDailyCandle(code: string, date: string): Promise<PriceDailyCandle> {
    const stock = this.stocksService.getByCode(code)
    const [marketDay, candle] = await Promise.all([
      this.marketData.marketDay({
        date,
        quotationMarket: stock.quotationMarket,
      }),
      this.marketData.dailyCandle({
        stockCode: code,
        date,
        quotationMarket: stock.quotationMarket,
      }),
    ])

    return {
      stock,
      requestedDate: date,
      quotationMarket: stock.quotationMarket,
      isTradingDay: marketDay.isTradingDay,
      candle,
    }
  }

  async getCurrentPrice(code: string, now = new Date()): Promise<PriceCurrent> {
    this.stocksService.getByCode(code)

    const clock = kstClock(now)
    const marketDay = await this.marketData.marketDay({
      date: clock.date,
      quotationMarket: UNIFIED_QUOTATION_MARKET,
    })

    if (marketDay.isOpenDay && clock.time < UNIFIED_MARKET_CLOSE_TIME) {
      const current = await this.marketData.stockQuote({
        stockCode: code,
        quotationMarket: UNIFIED_QUOTATION_MARKET,
      })

      return {
        price: current.currentPrice,
        source: "stock-quote",
        quotationMarket: UNIFIED_QUOTATION_MARKET,
        basis: {
          type: "current-snapshot",
          requestedAt: clock.requestedAt,
        },
      }
    }

    const close = await this.marketData.lastTradingDayCandle({
      stockCode: code,
      asOfDate: clock.date,
      quotationMarket: UNIFIED_QUOTATION_MARKET,
    })

    return {
      price: close.closePrice,
      source: "daily-candle",
      quotationMarket: UNIFIED_QUOTATION_MARKET,
      basis: {
        type: "latest-close",
        tradingDate: close.date,
      },
    }
  }
}
