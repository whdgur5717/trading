import { z } from "zod"
import { REALTIME_ERRORS, type RealtimeErrorCode } from "./event"
import { MARKET_SESSIONS } from "./market-session"

export const streamQuerySchema = z.strictObject({
  symbols: z
    .string()
    .min(1)
    .max(128)
    .describe("Comma-separated stock symbols")
    .meta({ example: "005930,000660" }),
})

export const subscribedEventSchema = z.strictObject({
  symbol: z.string().meta({ example: "005930" }),
})

export const priceEventSchema = z.strictObject({
  symbol: z.string().meta({ example: "005930" }),
  price: z.number().meta({ example: 78000 }),
  executedAt: z.iso
    .datetime({ offset: true })
    .meta({ example: "2026-05-15T10:30:15+09:00" }),
})

export const marketEventSchema = z.strictObject({
  session: z
    .enum(MARKET_SESSIONS.map(({ session }) => session))
    .meta({ example: "REGULAR_MARKET" }),
})

export const heartbeatEventSchema = z.strictObject({
  at: z.iso.datetime().meta({ example: "2026-05-15T01:30:15.000Z" }),
})

export const disconnectedEventSchema = z.strictObject({
  closeCode: z.number().int().meta({ example: 1006 }),
  reason: z.string().meta({ example: "" }),
})

export const reconnectedEventSchema = z.strictObject({
  symbols: z.array(z.string()).meta({ example: ["005930", "000660"] }),
})

export const realtimeErrorEventSchema = z.strictObject({
  code: z.enum(
    Object.keys(REALTIME_ERRORS) as [RealtimeErrorCode, ...RealtimeErrorCode[]]
  ),
  message: z
    .string()
    .meta({ example: REALTIME_ERRORS.FEED_UNAVAILABLE.message }),
  retryAfterMs: z.number().int().nonnegative().meta({ example: 300000 }),
})
