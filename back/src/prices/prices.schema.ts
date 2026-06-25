import { z } from "zod"
import { stockSymbolSchema } from "../market/port/data"

const decimalTextSchema = z.string().min(1)

export const priceQuerySchema = z.object({
  symbol: stockSymbolSchema,
})

export const priceSchema = z.object({
  symbol: stockSymbolSchema,
  currentPrice: decimalTextSchema.meta({ example: "80000" }),
  openPrice: decimalTextSchema.meta({ example: "79000" }),
  highPrice: decimalTextSchema.meta({ example: "81000" }),
  lowPrice: decimalTextSchema.meta({ example: "78000" }),
  volume: decimalTextSchema.meta({ example: "12345678" }),
  changePrice: decimalTextSchema.meta({ example: "10000" }),
  changeRate: decimalTextSchema.meta({ example: "14.29" }),
})

export type PriceQuery = z.infer<typeof priceQuerySchema>
export type Price = z.infer<typeof priceSchema>
