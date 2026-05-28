import type { RealtimePriceEvent } from "../realtime.schema"

export const MARKET_PORT = Symbol("MARKET_PORT")

export type MarketAction = "subscribe" | "unsubscribe"

export interface MarketPort {
  getUrl(): string
  getAuthKey(): Promise<string>
  parseMessage(raw: string): RealtimePriceEvent | null
  createSubscriptionMessage(params: {
    action: MarketAction
    authKey: string
    stockCode: string
  }): string
}
