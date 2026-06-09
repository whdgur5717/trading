import { z } from "zod"

export const stockCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{1,9}$/)
  .meta({ description: "Listed stock code", example: "005930" })

export const tradingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ description: "Trading date", example: "2026-05-15" })

export const quotationMarketSchema = z
  .enum(["KRX", "NXT", "CONSOLIDATED"])
  .meta({ description: "Quotation market", example: "KRX" })

export const stockQuoteQuerySchema = z
  .strictObject({
    stockCode: stockCodeSchema,
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Current stock quote query" })

export const dailyCandleQuerySchema = z
  .strictObject({
    stockCode: stockCodeSchema,
    date: tradingDateSchema,
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Daily price candle query" })

export const lastTradingDayCandleQuerySchema = z
  .strictObject({
    stockCode: stockCodeSchema,
    asOfDate: tradingDateSchema,
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Last trading day candle query" })

export const marketDayQuerySchema = z
  .strictObject({
    date: tradingDateSchema,
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Market day query" })

export const stockQuoteSchema = z
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
    accumulatedVolume: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: "Accumulated volume", example: 12345678 }),
    previousDayChange: z
      .number()
      .meta({ description: "Previous day price change", example: 500 }),
    previousDayChangeRate: z
      .number()
      .meta({ description: "Previous day change rate", example: 0.65 }),
  })
  .meta({ description: "Current stock quote" })

export const dailyCandleSchema = z
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
    accumulatedVolume: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: "Accumulated volume", example: 12345678 }),
  })
  .meta({ description: "Daily OHLCV candle" })

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

export type StockCode = z.output<typeof stockCodeSchema>
export type TradingDate = z.output<typeof tradingDateSchema>
export type QuotationMarket = z.output<typeof quotationMarketSchema>
export type StockQuoteQuery = z.output<typeof stockQuoteQuerySchema>
export type DailyCandleQuery = z.output<typeof dailyCandleQuerySchema>
export type LastTradingDayCandleQuery = z.output<
  typeof lastTradingDayCandleQuerySchema
>
export type MarketDayQuery = z.output<typeof marketDayQuerySchema>
export type StockQuote = z.output<typeof stockQuoteSchema>
export type DailyCandle = z.output<typeof dailyCandleSchema>
export type MarketDay = z.output<typeof marketDaySchema>

export const MARKET_DATA_PORT = Symbol("MARKET_DATA_PORT")

export interface MarketDataPort {
  stockQuote(query: StockQuoteQuery): Promise<StockQuote>
  dailyCandle(query: DailyCandleQuery): Promise<DailyCandle | null>
  lastTradingDayCandle(query: LastTradingDayCandleQuery): Promise<DailyCandle>
  marketDay(query: MarketDayQuery): Promise<MarketDay>
}
