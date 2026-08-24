import type { StockSymbol, TradeTick } from "../external/schema"
import type { MarketSession } from "./market-session"

export const REALTIME_ERRORS = {
  FEED_UNAVAILABLE: {
    message: "실시간 가격을 불러오지 못했어요.",
  },
  MARKET_SESSION_UNAVAILABLE: {
    message: "현재 거래 여부를 확인하지 못했어요.",
  },
  MARKET_SESSION_AUTH_UNAVAILABLE: {
    message: "현재 거래 여부를 확인하지 못했어요.",
  },
  MARKET_SESSION_TIMEOUT: {
    message: "현재 거래 여부를 확인하지 못했어요.",
  },
  MARKET_SESSION_INVALID_RESPONSE: {
    message: "현재 거래 여부를 확인하지 못했어요.",
  },
  MARKET_SESSION_NOT_FOUND: {
    message: "현재 거래 여부를 확인하지 못했어요.",
  },
} as const

export type RealtimeErrorCode = keyof typeof REALTIME_ERRORS

export type RealtimeEvent =
  | {
      type: "subscribed"
      symbol: StockSymbol
    }
  | {
      type: "trade"
      trade: TradeTick
    }
  | {
      type: "market"
      session: MarketSession
    }
  | {
      type: "disconnected"
      closeCode: number
      reason: string
    }
  | {
      type: "reconnected"
      symbols: StockSymbol[]
    }
  | {
      type: "unavailable"
      code: RealtimeErrorCode
      message: string
      retryAfterMs: number
    }
