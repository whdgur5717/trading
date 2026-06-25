import type { MarketDataProviderError } from "../market/market-data.error"

export type RealtimeConnectionError =
  | {
      readonly type: "feed-authorization"
      readonly error: MarketDataProviderError
    }
  | {
      readonly type: "websocket-timeout"
      readonly message: string
    }
  | {
      readonly type: "websocket-error"
      readonly message: string
    }
  | {
      readonly type: "websocket-not-open"
      readonly message: string
    }
  | {
      readonly type: "credential-missing"
      readonly message: string
    }
  | {
      readonly type: "websocket-send-failed"
      readonly message: string
    }

export function connectionErrorMessage(error: RealtimeConnectionError): string {
  switch (error.type) {
    case "feed-authorization":
      return error.error.message ?? error.error.type
    case "websocket-timeout":
    case "websocket-error":
    case "websocket-not-open":
    case "credential-missing":
    case "websocket-send-failed":
      return error.message
  }
}
