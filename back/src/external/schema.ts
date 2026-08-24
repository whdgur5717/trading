import { z } from "zod"

export const externalProviderSchema = z
  .enum(["kis", "fsc", "opendart"])
  .meta({ example: "kis" })

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
    count: z.number().int().min(1).max(100),
    quotationMarket: quotationMarketSchema,
  })
  .meta({ description: "Price candles query" })

export const marketDayQuerySchema = z
  .strictObject({
    date: tradingDateSchema,
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
export type ExternalProvider = z.output<typeof externalProviderSchema>
export type TradingDate = z.output<typeof tradingDateSchema>
export type QuotationMarket = z.output<typeof quotationMarketSchema>
export type CandleInterval = z.output<typeof candleIntervalSchema>
export type PriceQuery = z.output<typeof priceQuerySchema>
export type CandlesQuery = z.output<typeof candlesQuerySchema>
export type MarketDayQuery = z.output<typeof marketDayQuerySchema>
export type Price = z.output<typeof priceSchema>
export type Candle = z.output<typeof candleSchema>
export type MarketDay = z.output<typeof marketDaySchema>

export const dailyStockPriceSchema = z.strictObject({
  date: tradingDateSchema,
  symbol: stockSymbolSchema,
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
  symbol: stockSymbolSchema.nullable(),
  stockName: z.string().min(1).nullable(),
  corpClass: z.string().min(1),
  industryCode: z.string().min(1).nullable(),
  establishedDate: z.string().min(1).nullable(),
  settlementMonth: z.string().min(1).nullable(),
})

export const marketDisclosureSchema = z.strictObject({
  receiptNo: z.string().min(1),
  corpCode: z.string().regex(/^\d{8}$/),
  symbol: stockSymbolSchema.nullable(),
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

export type DailyStockPrice = z.output<typeof dailyStockPriceSchema>
export type DailyMarketIndex = z.output<typeof dailyMarketIndexSchema>
export type CompanyProfile = z.output<typeof companyProfileSchema>
export type MarketDisclosure = z.output<typeof marketDisclosureSchema>
export type FinancialAccount = z.output<typeof financialAccountSchema>
export type DisclosureQuery = z.output<typeof disclosureQuerySchema>
export type FinancialAccountsQuery = z.output<
  typeof financialAccountsQuerySchema
>

export const tradeTickSchema = z.strictObject({
  symbol: stockSymbolSchema,
  price: z.number().nonnegative(),
  executedAt: z.iso.datetime({ offset: true }),
})

export type TradeTick = z.output<typeof tradeTickSchema>

export type ExternalStreamState =
  | {
      status: "connected"
      provider: ExternalProvider
    }
  | {
      status: "disconnected"
      provider: ExternalProvider
      closeCode: number
      reason: string
    }
  | {
      status: "unavailable"
      provider: ExternalProvider
      message: string
      retryAfterMs: number
    }

export type TradeStreamEvent =
  | {
      type: "trade"
      trade: TradeTick
    }
  | {
      type: "disconnected"
      closeCode: number
      reason: string
    }
  | {
      type: "reconnected"
    }
  | {
      type: "unavailable"
      message: string
      retryAfterMs: number
    }
