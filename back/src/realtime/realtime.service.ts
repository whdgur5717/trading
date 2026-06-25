import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import type { MessageEvent } from "@nestjs/common"
import type { Result } from "neverthrow"
import { Observable, Subject } from "rxjs"
import {
  REALTIME_TRADE_FEED_PORT,
  type RealtimeTradeFeedPort,
  type TradeTick,
} from "../market/port/realtime"
import {
  connectionErrorMessage,
  type RealtimeConnectionError,
} from "./realtime-connection-error"
import { RealtimeFeedSession } from "./realtime-feed-session"
import { RealtimeSubscriptionRegistry } from "./realtime-subscription-registry"
import { createRealtimeStream } from "./realtime-stream"

const RECONNECT_DELAYS_MS = [0, 1_000, 3_000] as const
const COOLDOWN_MS = 5 * 60_000
const FEED_UNAVAILABLE_CODE = "FEED_UNAVAILABLE"

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name)
  private readonly registry = new RealtimeSubscriptionRegistry()
  private readonly priceSubject = new Subject<TradeTick>()
  private readonly statusSubject = new Subject<MessageEvent>()
  private readonly feedSession: RealtimeFeedSession

  private connectionAttempt: Promise<void> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private failedConnectionAttempts = 0
  private cooldownUntil = 0
  private isShuttingDown = false

  constructor(
    @Inject(REALTIME_TRADE_FEED_PORT)
    private readonly tradeFeed: RealtimeTradeFeedPort
  ) {
    this.feedSession = new RealtimeFeedSession(this.tradeFeed, {
      onPrice: (event) => {
        this.priceSubject.next(event)
      },
      onDisconnected: ({ closeCode, reason }) => {
        this.statusSubject.next({
          type: "disconnected",
          data: {
            closeCode,
            reason,
          },
        })
      },
      onClosed: () => {
        this.failedConnectionAttempts = 0
        this.scheduleConnectionAttempt()
      },
    })
  }

  stream(stockCodes: string[]): Observable<MessageEvent> {
    return createRealtimeStream({
      stockCodes,
      registry: this.registry,
      priceSubject: this.priceSubject,
      statusSubject: this.statusSubject,
      getCooldownRemainingMs: () => this.getCooldownRemainingMs(),
      createFeedUnavailableEvent: (retryAfterMs) =>
        this.createFeedUnavailableEvent(retryAfterMs),
      scheduleConnectionAttempt: () => this.scheduleConnectionAttempt(),
      unsubscribeStockCode: (stockCode) => this.unsubscribeStockCode(stockCode),
      resetIdleConnection: () => {
        this.clearReconnectTimer()
        this.failedConnectionAttempts = 0
      },
    })
  }

  onModuleDestroy(): void {
    this.isShuttingDown = true
    this.clearReconnectTimer()
    this.priceSubject.complete()
    this.statusSubject.complete()
    this.feedSession.close()
  }

  private async subscribeStockCode(
    stockCode: string
  ): Promise<Result<void, RealtimeConnectionError>> {
    if (!this.registry.isStockCodeActive(stockCode)) {
      return this.feedSession.connect()
    }

    const subscribed = await this.feedSession.subscribe(stockCode)

    if (subscribed.isErr()) {
      return subscribed
    }

    if (!this.registry.isStockCodeActive(stockCode)) {
      this.unsubscribeStockCode(stockCode)
    }

    return subscribed
  }

  private unsubscribeStockCode(stockCode: string): void {
    const sent = this.feedSession.unsubscribe(stockCode)
    if (sent.isErr()) {
      this.logger.warn(
        `Realtime feed unsubscribe failed for ${stockCode}: ${connectionErrorMessage(sent.error)}`
      )
    }
  }

  private scheduleConnectionAttempt(): void {
    if (this.isShuttingDown || this.reconnectTimer || this.connectionAttempt) {
      return
    }

    const activeStockCodes = this.registry.getActiveStockCodes()
    if (activeStockCodes.length === 0) {
      this.failedConnectionAttempts = 0
      return
    }

    const cooldownMs = this.getCooldownRemainingMs()
    if (cooldownMs > 0) {
      this.statusSubject.next(this.createFeedUnavailableEvent(cooldownMs))
      return
    }

    const delay =
      RECONNECT_DELAYS_MS[this.failedConnectionAttempts] ??
      RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1]

    this.logger.warn(
      `Scheduling realtime feed connection attempt ${
        this.failedConnectionAttempts + 1
      }/${RECONNECT_DELAYS_MS.length} in ${delay}ms for ${activeStockCodes.length} active stock code(s)`
    )

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      const connectionAttempt = this.connectAndSubscribeActiveStockCodes()
      this.connectionAttempt = connectionAttempt

      connectionAttempt
        .catch((error: unknown) => {
          this.logger.error("Unexpected realtime feed attempt failure", error)
        })
        .finally(() => {
          if (this.connectionAttempt === connectionAttempt) {
            this.connectionAttempt = null
          }
        })
    }, delay)
  }

  private async connectAndSubscribeActiveStockCodes(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    const activeStockCodes = this.registry.getActiveStockCodes()
    if (activeStockCodes.length === 0) {
      this.failedConnectionAttempts = 0
      return
    }

    try {
      const connected = await this.feedSession.connect()

      if (connected.isErr()) {
        this.handleConnectionFailure(connected.error)
        return
      }

      const latestStockCodes = this.registry.getActiveStockCodes()
      for (const stockCode of latestStockCodes) {
        const subscribed = await this.subscribeStockCode(stockCode)

        if (subscribed.isErr()) {
          this.handleConnectionFailure(subscribed.error)
          return
        }
      }

      const recoveredAfterFailure = this.failedConnectionAttempts > 0
      this.failedConnectionAttempts = 0
      this.cooldownUntil = 0

      if (recoveredAfterFailure) {
        this.statusSubject.next({
          type: "reconnected",
          data: {
            symbols: latestStockCodes,
          },
        })
      }

      this.logger.log(
        `Realtime feed connected and subscribed ${latestStockCodes.length} active stock code(s)`
      )
    } catch (error) {
      this.handleConnectionFailure({
        type: "websocket-error",
        message:
          error instanceof Error
            ? error.message
            : "Realtime feed connection failed",
      })
    }
  }

  private handleConnectionFailure(error: RealtimeConnectionError): void {
    this.failedConnectionAttempts += 1
    this.logger.error(
      `Realtime feed connection attempt ${this.failedConnectionAttempts}/${RECONNECT_DELAYS_MS.length} failed: ${connectionErrorMessage(error)}`
    )

    if (this.failedConnectionAttempts >= RECONNECT_DELAYS_MS.length) {
      this.startCooldown()
      return
    }

    this.connectionAttempt = null
    this.scheduleConnectionAttempt()
  }

  private startCooldown(): void {
    this.clearReconnectTimer()
    this.failedConnectionAttempts = 0
    this.cooldownUntil = Date.now() + COOLDOWN_MS
    this.feedSession.close()

    this.statusSubject.next(this.createFeedUnavailableEvent(COOLDOWN_MS))
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return
    }

    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private getCooldownRemainingMs(): number {
    const remainingMs = this.cooldownUntil - Date.now()

    if (remainingMs <= 0) {
      this.cooldownUntil = 0
      return 0
    }

    return remainingMs
  }

  private createFeedUnavailableEvent(retryAfterMs: number): MessageEvent {
    return {
      type: "error",
      retry: retryAfterMs,
      data: {
        code: FEED_UNAVAILABLE_CODE,
        message: "Realtime feed connection failed",
        retryAfterMs,
      },
    }
  }
}
