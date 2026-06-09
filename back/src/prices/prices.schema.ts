import { z } from "zod"
import { pastOrTodayIsoDateSchema } from "../common/validation/date"
import { dailyCandleSchema, stockQuoteSchema } from "../market/port/data"
import {
  quotationMarketSchema,
  stockCodeSchema,
  stockSchema,
} from "../stocks/stock.schema"

export const priceCodeParamSchema = z.object({
  code: stockCodeSchema,
})

export const priceDailyCandleQuerySchema = z.object({
  date: pastOrTodayIsoDateSchema.meta({ example: "2026-05-15" }),
})

export const priceQuoteSchema = z.object({
  stock: stockSchema,
  quotationMarket: quotationMarketSchema,
  price: stockQuoteSchema,
})

export const priceDailyCandleSchema = z.object({
  stock: stockSchema,
  requestedDate: z.string().meta({ example: "2026-05-15" }),
  quotationMarket: quotationMarketSchema,
  isTradingDay: z.boolean().meta({ example: true }),
  candle: dailyCandleSchema.nullable(),
})

export const priceCurrentSchema = z.object({
  price: z.number().meta({ example: 80000 }),
  source: z.enum(["stock-quote", "daily-candle"]).meta({
    example: "stock-quote",
  }),
  quotationMarket: z.literal("CONSOLIDATED").meta({ example: "CONSOLIDATED" }),
  basis: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("current-snapshot").meta({ example: "current-snapshot" }),
      requestedAt: z.string().meta({ example: "2026-06-03T09:00:01+09:00" }),
    }),
    z.object({
      type: z.literal("latest-close").meta({ example: "latest-close" }),
      tradingDate: z.string().meta({ example: "2026-06-02" }),
    }),
  ]),
})

export type PriceCodeParam = z.infer<typeof priceCodeParamSchema>
export type PriceDailyCandleQuery = z.infer<typeof priceDailyCandleQuerySchema>
export type PriceCurrent = z.infer<typeof priceCurrentSchema>
export type PriceQuote = z.infer<typeof priceQuoteSchema>
export type PriceDailyCandle = z.infer<typeof priceDailyCandleSchema>
