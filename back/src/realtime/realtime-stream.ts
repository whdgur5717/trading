import type { MessageEvent } from "@nestjs/common"
import { randomUUID } from "node:crypto"
import { Observable, Subject, Subscription } from "rxjs"
import type { TradeTick } from "../market/port/realtime"
import { RealtimeSubscriptionRegistry } from "./realtime-subscription-registry"

type RealtimeStreamInput = {
  readonly stockCodes: string[]
  readonly registry: RealtimeSubscriptionRegistry
  readonly priceSubject: Subject<TradeTick>
  readonly statusSubject: Subject<MessageEvent>
  readonly getCooldownRemainingMs: () => number
  readonly createFeedUnavailableEvent: (retryAfterMs: number) => MessageEvent
  readonly scheduleConnectionAttempt: () => void
  readonly unsubscribeStockCode: (stockCode: string) => void
  readonly resetIdleConnection: () => void
}

export function createRealtimeStream({
  stockCodes,
  registry,
  priceSubject,
  statusSubject,
  getCooldownRemainingMs,
  createFeedUnavailableEvent,
  scheduleConnectionAttempt,
  unsubscribeStockCode,
  resetIdleConnection,
}: RealtimeStreamInput): Observable<MessageEvent> {
  return new Observable<MessageEvent>((subscriber) => {
    const cooldownMs = getCooldownRemainingMs()
    if (cooldownMs > 0) {
      subscriber.next(createFeedUnavailableEvent(cooldownMs))
      subscriber.complete()
      return
    }

    const clientId = randomUUID()
    const { subscribedStockCodes } = registry.addClient(clientId, stockCodes)
    const priceSubscription: Subscription = priceSubject.subscribe((event) => {
      if (registry.isClientSubscribed(clientId, event.stockCode)) {
        const { stockCode, ...data } = event
        subscriber.next({
          type: "price",
          data: {
            ...data,
            symbol: stockCode,
          },
        })
      }
    })
    const statusSubscription: Subscription = statusSubject.subscribe(
      (event) => {
        subscriber.next(event)

        if (event.type === "error") {
          subscriber.complete()
        }
      }
    )

    for (const stockCode of subscribedStockCodes) {
      subscriber.next({
        type: "subscribed",
        data: { symbol: stockCode },
      })
    }

    scheduleConnectionAttempt()

    const heartbeatTimer = setInterval(() => {
      subscriber.next({
        type: "heartbeat",
        data: {
          at: new Date().toISOString(),
        },
      })
    }, 15_000)

    return () => {
      clearInterval(heartbeatTimer)
      priceSubscription.unsubscribe()
      statusSubscription.unsubscribe()

      const { deactivatedStockCodes } = registry.removeClient(clientId)
      for (const stockCode of deactivatedStockCodes) {
        unsubscribeStockCode(stockCode)
      }

      if (registry.getActiveStockCodes().length === 0) {
        resetIdleConnection()
      }
    }
  })
}
