import type { Result } from "neverthrow"
import { z } from "zod"
import type { MarketDataError } from "../market-data.error"
import type {
  CompanyProfile,
  DailyMarketIndex,
  DailyStockPrice,
  DisclosureQuery,
  FinancialAccount,
  FinancialAccountsQuery,
  MarketDisclosure,
} from "../market.schema"

export const stockSymbolSchema = z
  .string()
  .regex(/^[A-Z0-9]{1,9}$/)
  .meta({ description: "Listed stock symbol", example: "005930" })

export const tradingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ description: "Trading date", example: "2026-05-15" })

export const quotationMarketSchema = z
  .enum(["KRX", "NXT", "CONSOLIDATED"])
  .meta({ description: "Quotation market", example: "KRX" })

export const priceQuerySchema = z
  .strictObject({
    symbol: stockSymbolSchema,
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Current stock price query" })

export const candleIntervalSchema = z.literal("1d").meta({ example: "1d" })

export const candlesQuerySchema = z
  .strictObject({
    symbol: stockSymbolSchema,
    interval: candleIntervalSchema,
    before: tradingDateSchema,
    count: z.number().int().min(1).max(200),
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Price candles query" })

export const marketDayQuerySchema = z
  .strictObject({
    date: tradingDateSchema,
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Market day query" })

export const priceSchema = z
  .strictObject({
    currentPrice: z
      .number()
      .nonnegative()
      .meta({ description: "Current price", example: 78000 }),
    openPrice: z
      .number()
      .nonnegative()
      .meta({ description: "Opening price", example: 77500 }),
    highPrice: z
      .number()
      .nonnegative()
      .meta({ description: "High price", example: 78500 }),
    lowPrice: z
      .number()
      .nonnegative()
      .meta({ description: "Low price", example: 77000 }),
    volume: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: "Volume", example: 12345678 }),
    changePrice: z.number().meta({ description: "Price change", example: 500 }),
    changeRate: z.number().meta({ description: "Change rate", example: 0.65 }),
  })
  .meta({ description: "Current stock price" })

export const candleSchema = z
  .strictObject({
    date: tradingDateSchema,
    openPrice: z
      .number()
      .nonnegative()
      .meta({ description: "Opening price", example: 77500 }),
    highPrice: z
      .number()
      .nonnegative()
      .meta({ description: "High price", example: 78500 }),
    lowPrice: z
      .number()
      .nonnegative()
      .meta({ description: "Low price", example: 77000 }),
    closePrice: z
      .number()
      .nonnegative()
      .meta({ description: "Closing price", example: 78000 }),
    volume: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: "Volume", example: 12345678 }),
  })
  .meta({ description: "OHLCV candle" })

export const marketDaySchema = z
  .strictObject({
    date: tradingDateSchema,
    quotationMarket: quotationMarketSchema,
    isBusinessDay: z
      .boolean()
      .meta({ description: "Business day", example: true }),
    isTradingDay: z
      .boolean()
      .meta({ description: "Trading day", example: true }),
    isOpenDay: z.boolean().meta({ description: "Open day", example: true }),
    isSettlementDay: z
      .boolean()
      .meta({ description: "Settlement day", example: true }),
  })
  .meta({ description: "Market day" })

export type StockSymbol = z.output<typeof stockSymbolSchema>
export type TradingDate = z.output<typeof tradingDateSchema>
export type QuotationMarket = z.output<typeof quotationMarketSchema>
export type CandleInterval = z.output<typeof candleIntervalSchema>
export type PriceQuery = z.output<typeof priceQuerySchema>
export type CandlesQuery = z.output<typeof candlesQuerySchema>
export type MarketDayQuery = z.output<typeof marketDayQuerySchema>
export type Price = z.output<typeof priceSchema>
export type Candle = z.output<typeof candleSchema>
export type MarketDay = z.output<typeof marketDaySchema>

export const MARKET_DATA_PORT = Symbol("MARKET_DATA_PORT")

export interface MarketDataPort {
  price(query: PriceQuery): Promise<Result<Price, MarketDataError>>
  candles(query: CandlesQuery): Promise<Result<Candle[], MarketDataError>>
  marketDay(query: MarketDayQuery): Promise<Result<MarketDay, MarketDataError>>
  dailyStocks(date: string): Promise<Result<DailyStockPrice[], MarketDataError>>
  dailyIndexes(
    date: string
  ): Promise<Result<DailyMarketIndex[], MarketDataError>>
  corpCode(stockCode: string): Result<string, MarketDataError>
  company(corpCode: string): Promise<Result<CompanyProfile, MarketDataError>>
  disclosures(
    query: DisclosureQuery
  ): Promise<Result<MarketDisclosure[], MarketDataError>>
  financialAccounts(
    query: FinancialAccountsQuery
  ): Promise<Result<FinancialAccount[], MarketDataError>>
}
