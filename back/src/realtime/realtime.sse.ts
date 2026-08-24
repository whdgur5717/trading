import { Observable } from "rxjs"
import type { StockSymbol, TradeTick } from "../external/schema"
import {
  REALTIME_ERRORS,
  type RealtimeErrorCode,
  type RealtimeEvent,
} from "./event"
import type { MarketSession } from "./market-session"

const HEARTBEAT_INTERVAL_MS = 15_000

export type RealtimeSseEvent =
  | {
      type: "subscribed"
      data: { symbol: StockSymbol }
    }
  | {
      type: "price"
      data: TradeTick
    }
  | {
      type: "market"
      data: { session: MarketSession }
    }
  | {
      type: "heartbeat"
      data: { at: string }
    }
  | {
      type: "disconnected"
      data: { closeCode: number; reason: string }
    }
  | {
      type: "reconnected"
      data: { symbols: StockSymbol[] }
    }
  | {
      type: "realtime-error"
      retry: number
      data: {
        code: RealtimeErrorCode
        message: string
        retryAfterMs: number
      }
    }

export function toServerSentEvents(
  source: Observable<RealtimeEvent>
): Observable<RealtimeSseEvent> {
  return new Observable<RealtimeSseEvent>((subscriber) => {
    const heartbeat = setInterval(() => {
      subscriber.next({
        type: "heartbeat",
        data: { at: new Date().toISOString() },
      })
    }, HEARTBEAT_INTERVAL_MS)

    const events = source.subscribe({
      next: (event) => {
        subscriber.next(toMessageEvent(event))
        if (event.type === "unavailable") {
          subscriber.complete()
        }
      },
      error: () => {
        subscriber.next({
          type: "realtime-error",
          retry: 0,
          data: {
            code: "FEED_UNAVAILABLE",
            message: REALTIME_ERRORS.FEED_UNAVAILABLE.message,
            retryAfterMs: 0,
          },
        })
        subscriber.complete()
      },
      complete: () => subscriber.complete(),
    })

    return () => {
      clearInterval(heartbeat)
      events.unsubscribe()
    }
  })
}

function toMessageEvent(event: RealtimeEvent): RealtimeSseEvent {
  switch (event.type) {
    case "subscribed":
      return { type: "subscribed", data: { symbol: event.symbol } }
    case "trade":
      return { type: "price", data: event.trade }
    case "market":
      return { type: "market", data: { session: event.session } }
    case "disconnected":
      return {
        type: "disconnected",
        data: { closeCode: event.closeCode, reason: event.reason },
      }
    case "reconnected":
      return { type: "reconnected", data: { symbols: event.symbols } }
    case "unavailable":
      return {
        type: "realtime-error",
        retry: event.retryAfterMs,
        data: {
          code: event.code,
          message: event.message,
          retryAfterMs: event.retryAfterMs,
        },
      }
  }
}
