import { z } from "zod"
import { candlesSchema } from "../candles/candles.schema"
import { pastOrTodayIsoDateSchema } from "../common/validation/date"
import { priceSchema } from "../prices/prices.schema"
import { stockSchema } from "../stocks/stock.schema"

export const returnsQuerySchema = z.object({
  symbol: stockSchema.shape.symbol,
  buyDate: pastOrTodayIsoDateSchema.meta({ example: "2026-05-17" }),
  quantity: z.coerce.number().int().positive().meta({ example: 10 }),
})

export const returnBuySchema = z.object({
  date: z.string().meta({ example: "2026-05-17" }),
  price: z.string().meta({ example: "70000" }),
  quantity: z.number().meta({ example: 10 }),
})

export const returnCurrentSchema = priceSchema.pick({
  currentPrice: true,
})

export const returnCalculationSchema = z.object({
  buyAmount: z.number().meta({ example: 700000 }),
  currentValue: z.number().meta({ example: 800000 }),
  profit: z.number().meta({ example: 100000 }),
  profitRate: z.number().meta({ example: 14.29 }),
})

export const returnSummarySchema = z.object({
  stock: stockSchema,
  buy: returnBuySchema,
  current: returnCurrentSchema,
  result: returnCalculationSchema,
})

export const returnChartSchema = returnSummarySchema.extend({
  chart: candlesSchema.pick({
    interval: true,
    candles: true,
  }),
})

export type ReturnsQuery = z.infer<typeof returnsQuerySchema>
export type ReturnBuy = z.infer<typeof returnBuySchema>
export type ReturnCurrent = z.infer<typeof returnCurrentSchema>
export type ReturnCalculation = z.infer<typeof returnCalculationSchema>
export type ReturnSummary = z.infer<typeof returnSummarySchema>
export type ReturnChart = z.infer<typeof returnChartSchema>
