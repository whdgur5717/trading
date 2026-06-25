import { z } from "zod"
import { pastOrTodayIsoDateSchema } from "../common/validation/date"
import { candleIntervalSchema, stockSymbolSchema } from "../market/port/data"

const decimalTextSchema = z.string().min(1)

export const DEFAULT_CANDLE_COUNT = 100
export const MAX_CANDLE_COUNT = 200

export const candlesQuerySchema = z.object({
  symbol: stockSymbolSchema,
  interval: candleIntervalSchema,
  count: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_CANDLE_COUNT)
    .default(DEFAULT_CANDLE_COUNT)
    .meta({ example: DEFAULT_CANDLE_COUNT }),
  before: pastOrTodayIsoDateSchema.optional().meta({ example: "2026-05-17" }),
})

export const candleSchema = z.object({
  timestamp: z.string().meta({ example: "2026-05-17T09:00:00+09:00" }),
  openPrice: decimalTextSchema.meta({ example: "69000" }),
  highPrice: decimalTextSchema.meta({ example: "71000" }),
  lowPrice: decimalTextSchema.meta({ example: "68000" }),
  closePrice: decimalTextSchema.meta({ example: "70000" }),
  volume: decimalTextSchema.meta({ example: "12345678" }),
})

export const candlesSchema = z.object({
  symbol: stockSymbolSchema,
  interval: candleIntervalSchema,
  candles: z.array(candleSchema),
  nextBefore: z.string().nullable().meta({ example: "2026-05-17" }),
})

export type CandlesQuery = z.infer<typeof candlesQuerySchema>
export type Candle = z.infer<typeof candleSchema>
export type Candles = z.infer<typeof candlesSchema>
