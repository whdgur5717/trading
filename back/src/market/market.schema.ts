import { z } from "zod"
import {
  candleIntervalSchema,
  candleSchema,
  candlesQuerySchema,
  marketDayQuerySchema,
  marketDaySchema,
  priceQuerySchema,
  priceSchema,
  stockSymbolSchema,
  tradingDateSchema,
} from "./port/data"

export const dailyStockPriceSchema = z.strictObject({
  date: tradingDateSchema,
  stockCode: stockSymbolSchema,
  isinCode: z.string().min(1).nullable(),
  stockName: z.string().min(1),
  market: z.string().min(1),
  closePrice: z.number().nonnegative(),
  dailyReturnPct: z.number(),
  openPrice: z.number().nonnegative(),
  highPrice: z.number().nonnegative(),
  lowPrice: z.number().nonnegative(),
  volume: z.number().int().nonnegative(),
  tradeValue: z.number().nonnegative(),
  listedShares: z.number().int().nonnegative(),
  marketCap: z.number().nonnegative(),
})

export const dailyMarketIndexSchema = z.strictObject({
  date: tradingDateSchema,
  indexName: z.string().min(1),
  closePrice: z.number().nonnegative(),
  changeRate: z.number(),
  tradeValue: z.number().nonnegative().nullable(),
  marketCap: z.number().nonnegative().nullable(),
})

export const companyProfileSchema = z.strictObject({
  corpCode: z.string().regex(/^\d{8}$/),
  corpName: z.string().min(1),
  stockCode: stockSymbolSchema.nullable(),
  stockName: z.string().min(1).nullable(),
  corpClass: z.string().min(1),
  industryCode: z.string().min(1).nullable(),
  establishedDate: z.string().min(1).nullable(),
  settlementMonth: z.string().min(1).nullable(),
})

export const marketDisclosureSchema = z.strictObject({
  receiptNo: z.string().min(1),
  corpCode: z.string().regex(/^\d{8}$/),
  stockCode: stockSymbolSchema.nullable(),
  corpName: z.string().min(1),
  reportName: z.string().min(1),
  filerName: z.string().min(1),
  receiptDate: z.string().regex(/^\d{8}$/),
  remark: z.string(),
})

export const financialAccountSchema = z.strictObject({
  businessYear: z.string().regex(/^\d{4}$/),
  reportCode: z.enum(["11013", "11012", "11014", "11011"]),
  corpCode: z.string().regex(/^\d{8}$/),
  statementDivision: z.string().min(1),
  accountId: z.string().min(1).nullable(),
  accountName: z.string().min(1),
  currentAmount: z.number().nullable(),
  previousAmount: z.number().nullable(),
  beforePreviousAmount: z.number().nullable(),
  currency: z.string().min(1).nullable(),
})

export const disclosureQuerySchema = z.strictObject({
  corpCode: z.string().regex(/^\d{8}$/),
  beginDate: z.string().regex(/^\d{8}$/),
  endDate: z.string().regex(/^\d{8}$/),
})

export const financialAccountsQuerySchema = z.strictObject({
  corpCode: z.string().regex(/^\d{8}$/),
  businessYear: z.string().regex(/^\d{4}$/),
  reportCode: z.enum(["11013", "11012", "11014", "11011"]),
})

export type PriceQuery = z.output<typeof priceQuerySchema>
export type Price = z.output<typeof priceSchema>
export type CandlesQuery = z.output<typeof candlesQuerySchema>
export type CandleInterval = z.output<typeof candleIntervalSchema>
export type Candle = z.output<typeof candleSchema>
export type MarketDayQuery = z.output<typeof marketDayQuerySchema>
export type MarketDay = z.output<typeof marketDaySchema>
export type DailyStockPrice = z.output<typeof dailyStockPriceSchema>
export type DailyMarketIndex = z.output<typeof dailyMarketIndexSchema>
export type CompanyProfile = z.output<typeof companyProfileSchema>
export type MarketDisclosure = z.output<typeof marketDisclosureSchema>
export type FinancialAccount = z.output<typeof financialAccountSchema>
export type DisclosureQuery = z.output<typeof disclosureQuerySchema>
export type FinancialAccountsQuery = z.output<
  typeof financialAccountsQuerySchema
>
