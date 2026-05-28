import { z } from "zod"
import { pastOrTodayIsoDateSchema } from "../common/date-validation"
import {
  currentPriceSchema,
  dailyCandleSchema,
  kisMarketCodeSchema,
} from "../kis/kis.schema"

export const stockCodeSchema = z
  .string()
  .regex(/^\d{6}$/)
  .meta({ example: "005930" })

export const stockSearchQuerySchema = z.object({
  q: z.string().trim().min(1).meta({ example: "삼성" }),
})

export const stockCodeParamSchema = z.object({
  code: stockCodeSchema,
})

export const stockHistoryQuerySchema = z.object({
  date: pastOrTodayIsoDateSchema.meta({ example: "2026-05-15" }),
})

export const stockSchema = z.object({
  code: stockCodeSchema,
  name: z.string().meta({ example: "삼성전자" }),
  marketName: z.string().meta({ example: "KOSPI" }),
  kisMarketCode: kisMarketCodeSchema,
})

export const stockCurrentSchema = z.object({
  stock: stockSchema,
  marketCode: kisMarketCodeSchema,
  price: currentPriceSchema,
})

export const stockHistorySchema = z.object({
  stock: stockSchema,
  requestedDate: z.string().meta({ example: "2026-05-15" }),
  marketCode: kisMarketCodeSchema,
  isTradingDay: z.boolean().meta({ example: true }),
  candle: dailyCandleSchema.nullable(),
})

export type StockSearchQuery = z.infer<typeof stockSearchQuerySchema>
export type StockCodeParam = z.infer<typeof stockCodeParamSchema>
export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>
export type Stock = z.infer<typeof stockSchema>
export type StockCurrent = z.infer<typeof stockCurrentSchema>
export type StockHistory = z.infer<typeof stockHistorySchema>
