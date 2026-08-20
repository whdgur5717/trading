import { z } from "zod"

const numberTextSchema = z.string().min(1).pipe(z.coerce.number())
const compactDateSchema = z.string().regex(/^\d{8}$/)

export const kisTradePayloadSchema = z.string().transform((payload) => {
  const values = payload.split("^")
  const [symbol, tradeTime, rawPrice] = values
  const rawBusinessDate = values[33]

  if (!symbol || !tradeTime || !rawPrice || !rawBusinessDate) {
    return null
  }

  const price = numberTextSchema.safeParse(rawPrice)
  const businessDate = compactDateSchema.safeParse(rawBusinessDate)
  if (!price.success || !businessDate.success) {
    return null
  }

  return {
    symbol,
    price: price.data,
    executedAt: `${businessDate.data.slice(0, 4)}-${businessDate.data.slice(4, 6)}-${businessDate.data.slice(6, 8)}T${tradeTime.slice(0, 2)}:${tradeTime.slice(2, 4)}:${tradeTime.slice(4, 6)}+09:00`,
  }
})
