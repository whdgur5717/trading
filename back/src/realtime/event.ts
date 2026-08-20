import type { ExternalProvider, TradeTick } from "../external/schema"

export type RealtimeEvent =
  | {
      readonly type: "subscribed"
      readonly symbol: string
    }
  | {
      readonly type: "trade"
      readonly trade: TradeTick
    }
  | {
      readonly type: "disconnected"
      readonly provider: ExternalProvider
      readonly closeCode: number
      readonly reason: string
    }
  | {
      readonly type: "reconnected"
      readonly provider: ExternalProvider
      readonly symbols: readonly string[]
    }
  | {
      readonly type: "unavailable"
      readonly provider: ExternalProvider | null
      readonly message: string
      readonly retryAfterMs: number
    }
