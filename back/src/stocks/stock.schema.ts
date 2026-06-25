import { z } from "zod"
import { stockSymbolSchema } from "../market/port/data"

export const quotationMarketSchema = z
  .enum(["KRX", "NXT", "CONSOLIDATED"])
  .meta({ example: "KRX" })

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
  query: z.string().trim().min(1).meta({ example: "삼성" }),
})

export const stockSymbolParamSchema = z.object({
  symbol: stockSymbolSchema,
})

export const stockSchema = z.object({
  symbol: stockSymbolSchema,
  name: z.string().meta({ example: "삼성전자" }),
  marketName: z.string().meta({ example: "KOSPI" }),
  quotationMarket: quotationMarketSchema,
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

export const stockSourceSchema = stockSchema
  .omit({ symbol: true })
  .extend({
    code: stockSymbolSchema,
  })
  .transform(({ code, ...stock }) => ({
    ...stock,
    symbol: code,
  }))

export type StockSearchQuery = z.infer<typeof stockSearchQuerySchema>
export type StockSymbolParam = z.infer<typeof stockSymbolParamSchema>
export type StockProductType = z.infer<typeof stockProductTypeSchema>
export type StockQuotationMarket = z.infer<typeof quotationMarketSchema>
export type Stock = z.infer<typeof stockSchema>
