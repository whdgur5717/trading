import { z } from "zod"
import { externalProviderSchema } from "../../external/schema"

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

export const heartbeatEventSchema = z.strictObject({
  at: z.iso.datetime().meta({ example: "2026-05-15T01:30:15.000Z" }),
})

export const disconnectedEventSchema = z.strictObject({
  provider: externalProviderSchema,
  closeCode: z.number().int().meta({ example: 1006 }),
  reason: z.string().meta({ example: "" }),
})

export const reconnectedEventSchema = z.strictObject({
  provider: externalProviderSchema,
  symbols: z.array(z.string()).meta({ example: ["005930", "000660"] }),
})

export const unavailableEventSchema = z.strictObject({
  code: z.literal("FEED_UNAVAILABLE"),
  provider: externalProviderSchema.nullable(),
  message: z.string().meta({ example: "Realtime feed is unavailable" }),
  retryAfterMs: z.number().int().nonnegative().meta({ example: 300000 }),
})
