import { z } from "zod"
import { pastOrTodayIsoDateSchema } from "../common/date-validation"
import {
  currentPriceSchema,
  dailyCandleSchema,
  kisMarketCodeSchema,
} from "../kis/kis.schema"

export const stockCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{1,9}$/)
  .meta({ example: "005930" })

export const stockProductTypeSchema = z.enum([
  "STOCK",
  "PREFERRED",
  "ETF",
  "ETN",
  "REIT",
  "BENEFICIARY_CERTIFICATE",
  "SPAC",
  "OTHER",
])

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
  standardCode: z.string().optional().meta({ example: "KR7005930003" }),
  securityGroupCode: z.string().optional().meta({ example: "ST" }),
  rawEtpType: z.string().nullable().optional().meta({ example: "2" }),
  preferredStockType: z.string().nullable().optional().meta({ example: "0" }),
  productType: stockProductTypeSchema.optional().meta({ example: "STOCK" }),
  isPreferred: z.boolean().optional().meta({ example: false }),
  isEtf: z.boolean().optional().meta({ example: false }),
  isEtn: z.boolean().optional().meta({ example: false }),
  isSpac: z.boolean().optional().meta({ example: false }),
  isReit: z.boolean().optional().meta({ example: false }),
  isTradingHalted: z.boolean().optional().meta({ example: false }),
  isUnderAdministration: z.boolean().optional().meta({ example: false }),
  isLowLiquidity: z.boolean().optional().meta({ example: false }),
  marketCap: z.number().int().nonnegative().nullable().optional(),
  previousVolume: z.number().int().nonnegative().nullable().optional(),
  listedDate: z
    .string()
    .regex(/^\d{8}$/)
    .nullable()
    .optional()
    .meta({ example: "19750611" }),
  isKospi100: z.boolean().optional().meta({ example: true }),
  isKospi50: z.boolean().optional().meta({ example: true }),
  isKrx300: z.boolean().optional().meta({ example: true }),
  warningLevel: z.string().nullable().optional().meta({ example: "00" }),
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
export type StockProductType = z.infer<typeof stockProductTypeSchema>
export type Stock = z.infer<typeof stockSchema>
export type StockCurrent = z.infer<typeof stockCurrentSchema>
export type StockHistory = z.infer<typeof stockHistorySchema>
