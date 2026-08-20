import type { MessageEvent } from "@nestjs/common"
import { Observable } from "rxjs"
import type { RealtimeEvent } from "../event"

const HEARTBEAT_INTERVAL_MS = 15_000

export function toServerSentEvents(
  source: Observable<RealtimeEvent>
): Observable<MessageEvent> {
  return new Observable<MessageEvent>((subscriber) => {
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
          type: "error",
          data: {
            code: "FEED_UNAVAILABLE",
            provider: null,
            message: "Realtime feed is unavailable",
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

function toMessageEvent(event: RealtimeEvent): MessageEvent {
  switch (event.type) {
    case "subscribed":
      return { type: "subscribed", data: { symbol: event.symbol } }
    case "trade":
      return { type: "price", data: event.trade }
    case "disconnected":
      return {
        type: "disconnected",
        data: {
          provider: event.provider,
          closeCode: event.closeCode,
          reason: event.reason,
        },
      }
    case "reconnected":
      return {
        type: "reconnected",
        data: {
          provider: event.provider,
          symbols: event.symbols,
        },
      }
    case "unavailable":
      return {
        type: "error",
        retry: event.retryAfterMs,
        data: {
          code: "FEED_UNAVAILABLE",
          provider: event.provider,
          message: event.message,
          retryAfterMs: event.retryAfterMs,
        },
      }
  }
}
