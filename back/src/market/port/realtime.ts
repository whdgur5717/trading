import { z } from "zod"
import { stockCodeSchema, tradingDateSchema } from "./data"

export const feedEndpointSchema = z
  .string()
  .regex(/^wss?:\/\//)
  .meta({
    description: "Realtime feed endpoint",
    example: "ws://localhost:3101",
  })

export const feedCredentialSchema = z
  .strictObject({
    value: z
      .string()
      .min(1)
      .meta({ description: "Feed credential value", example: "approval-key" }),
  })
  .meta({ description: "Realtime feed credential" })

export const feedFrameSchema = z
  .string()
  .min(1)
  .meta({ description: "Realtime feed frame" })

export const tradeSubscriptionSchema = z
  .strictObject({
    credential: feedCredentialSchema,
    stockCode: stockCodeSchema,
  })
  .meta({ description: "Trade subscription" })

export const tradeTimeSchema = z
  .string()
  .regex(/^\d{6}$/)
  .meta({ description: "Trade time", example: "103015" })

export const tradeTickSchema = z
  .strictObject({
    stockCode: stockCodeSchema,
    trId: z
      .string()
      .min(1)
      .meta({ description: "Trade feed transaction id", example: "H0STCNT0" }),
    tradeTime: tradeTimeSchema,
    price: z
      .number()
      .nonnegative()
      .meta({ description: "Trade price", example: 78000 }),
    businessDate: tradingDateSchema,
  })
  .meta({ description: "Realtime trade tick" })

export type FeedEndpoint = z.output<typeof feedEndpointSchema>
export type FeedCredential = z.output<typeof feedCredentialSchema>
export type FeedFrame = z.output<typeof feedFrameSchema>
export type TradeSubscription = z.output<typeof tradeSubscriptionSchema>
export type TradeTime = z.output<typeof tradeTimeSchema>
export type TradeTick = z.output<typeof tradeTickSchema>

export const REALTIME_TRADE_FEED_PORT = Symbol("REALTIME_TRADE_FEED_PORT")

export interface RealtimeTradeFeedPort {
  endpoint(): FeedEndpoint
  authorize(): Promise<FeedCredential>
  subscribe(subscription: TradeSubscription): FeedFrame
  unsubscribe(subscription: TradeSubscription): FeedFrame
  decode(raw: string): TradeTick | null
}
