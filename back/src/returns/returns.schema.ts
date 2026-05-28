import { z } from "zod"
import { pastOrTodayIsoDateSchema } from "../common/date-validation"
import { kisMarketCodeSchema } from "../kis/kis.schema"
import { stockCodeSchema, stockSchema } from "../stocks/stock.schema"

export const returnsQuerySchema = z.object({
  code: stockCodeSchema,
  buyDate: pastOrTodayIsoDateSchema.meta({ example: "2026-05-15" }),
  quantity: z.coerce.number().int().positive().meta({ example: 10 }),
})

export const returnBuySchema = z.object({
  date: z.string().meta({ example: "2026-05-15" }),
  price: z.number().meta({ example: 78000 }),
  priceType: z.literal("adjusted-close").meta({ example: "adjusted-close" }),
  quantity: z.number().meta({ example: 10 }),
})

export const returnCurrentSchema = z.object({
  price: z.number().meta({ example: 80000 }),
  source: z
    .literal("kis-rest-current-price")
    .meta({ example: "kis-rest-current-price" }),
  marketCode: kisMarketCodeSchema,
})

export const returnCalculationSchema = z.object({
  buyAmount: z.number().meta({ example: 780000 }),
  currentValue: z.number().meta({ example: 800000 }),
  profit: z.number().meta({ example: 20000 }),
  profitRate: z.number().meta({ example: 2.56 }),
})

export const returnSummarySchema = z.object({
  stock: stockSchema,
  buy: returnBuySchema,
  current: returnCurrentSchema,
  result: returnCalculationSchema,
})

export type ReturnsQuery = z.infer<typeof returnsQuerySchema>
export type ReturnBuy = z.infer<typeof returnBuySchema>
export type ReturnCurrent = z.infer<typeof returnCurrentSchema>
export type ReturnCalculation = z.infer<typeof returnCalculationSchema>
export type ReturnSummary = z.infer<typeof returnSummarySchema>
