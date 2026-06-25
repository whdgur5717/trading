import { z } from "zod"

export const streamQuerySchema = z.object({
  symbols: z
    .string()
    .min(1)
    .max(128)
    .describe("Comma-separated stock symbols")
    .meta({ example: "005930,000660" }),
})

export const realtimePriceSchema = z.object({
  symbol: z.string().meta({ example: "005930" }),
  trId: z.string().meta({ example: "H0STCNT0" }),
  price: z.number().meta({ example: 78000 }),
  tradeTime: z.string().meta({ example: "103015" }),
  businessDate: z.string().meta({ example: "20260515" }),
})

export const realtimeSubscribedSchema = z.object({
  symbol: z.string().meta({ example: "005930" }),
})

export const realtimeHeartbeatSchema = z.object({
  at: z.string().meta({ example: "2026-05-15T01:30:15.000Z" }),
})

export const realtimeErrorSchema = z.object({
  code: z.string().meta({ example: "FEED_UNAVAILABLE" }),
  message: z.string().meta({ example: "Realtime feed connection failed" }),
  retryAfterMs: z.number().optional().meta({ example: 300000 }),
})

export const realtimeDisconnectedSchema = z.object({
  closeCode: z.number().meta({ example: 1006 }),
  reason: z.string().meta({ example: "" }),
})

export const realtimeReconnectedSchema = z.object({
  symbols: z.array(z.string()).meta({ example: ["005930", "000660"] }),
})

export type StreamQuery = z.infer<typeof streamQuerySchema>
export type RealtimePriceEvent = z.infer<typeof realtimePriceSchema>
export type RealtimeSubscribed = z.infer<typeof realtimeSubscribedSchema>
export type RealtimeHeartbeat = z.infer<typeof realtimeHeartbeatSchema>
export type RealtimeError = z.infer<typeof realtimeErrorSchema>
export type RealtimeDisconnected = z.infer<typeof realtimeDisconnectedSchema>
export type RealtimeReconnected = z.infer<typeof realtimeReconnectedSchema>
