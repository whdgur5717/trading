import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import type { MessageEvent } from "@nestjs/common"
import { isArrayBuffer, isString } from "es-toolkit"
import { randomUUID } from "node:crypto"
import { Observable, Subject, Subscription } from "rxjs"
import WebSocket from "ws"
import {
  REALTIME_TRADE_FEED_PORT,
  type FeedCredential,
  type RealtimeTradeFeedPort,
} from "../market/port/realtime"
import type { RealtimePriceEvent } from "./realtime.schema"
import { RealtimeSubscriptionRegistry } from "./realtime-subscription-registry"

const RECONNECT_DELAYS_MS = [0, 1_000, 3_000] as const
const COOLDOWN_MS = 5 * 60_000
const CONNECT_TIMEOUT_MS = 5_000
const FEED_UNAVAILABLE_CODE = "FEED_UNAVAILABLE"

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name)
  private readonly registry = new RealtimeSubscriptionRegistry()
  private readonly priceSubject = new Subject<RealtimePriceEvent>()
  private readonly statusSubject = new Subject<MessageEvent>()
  private readonly subscribedStockCodes = new Set<string>()

  private ws: WebSocket | null = null
  private connecting: Promise<void> | null = null
  private connectionAttempt: Promise<void> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private failedConnectionAttempts = 0
  private cooldownUntil = 0
  private isShuttingDown = false
  private credential: FeedCredential | null = null

  constructor(
    @Inject(REALTIME_TRADE_FEED_PORT)
    private readonly tradeFeed: RealtimeTradeFeedPort
  ) {}

  stream(stockCodes: string[]): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const cooldownMs = this.getCooldownRemainingMs()
      if (cooldownMs > 0) {
        subscriber.next(this.createFeedUnavailableEvent(cooldownMs))
        subscriber.complete()
        return
      }

      const clientId = randomUUID()
      const { subscribedStockCodes } = this.registry.addClient(
        clientId,
        stockCodes
      )
      const priceSubscription: Subscription = this.priceSubject.subscribe(
        (event) => {
          if (this.registry.isClientSubscribed(clientId, event.stockCode)) {
            subscriber.next({
              type: "price",
              data: event,
            })
          }
        }
      )
      const statusSubscription: Subscription = this.statusSubject.subscribe(
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
          data: { stockCode },
        })
      }

      this.scheduleConnectionAttempt()

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

        const { deactivatedStockCodes } = this.registry.removeClient(clientId)
        for (const stockCode of deactivatedStockCodes) {
          this.unsubscribeStockCode(stockCode)
        }

        if (this.registry.getActiveStockCodes().length === 0) {
          this.clearReconnectTimer()
          this.failedConnectionAttempts = 0
        }
      }
    })
  }

  onModuleDestroy(): void {
    this.isShuttingDown = true
    this.clearReconnectTimer()
    this.priceSubject.complete()
    this.statusSubject.complete()

    const ws = this.ws
    this.ws = null
    this.credential = null
    this.subscribedStockCodes.clear()

    if (!ws) {
      return
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.close()
      return
    }

    if (ws.readyState === WebSocket.CONNECTING) {
      ws.terminate()
    }
  }

  private async subscribeStockCode(stockCode: string): Promise<void> {
    await this.ensureConnected()

    if (!this.registry.isStockCodeActive(stockCode)) {
      return
    }

    if (this.subscribedStockCodes.has(stockCode)) {
      return
    }

    this.sendSubscriptionMessage("subscribe", stockCode)
    this.subscribedStockCodes.add(stockCode)

    if (!this.registry.isStockCodeActive(stockCode)) {
      this.unsubscribeStockCode(stockCode)
    }
  }

  private unsubscribeStockCode(stockCode: string): void {
    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      !this.subscribedStockCodes.has(stockCode)
    ) {
      return
    }

    this.sendSubscriptionMessage("unsubscribe", stockCode)
    this.subscribedStockCodes.delete(stockCode)
  }

  private async ensureConnected(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    if (this.connecting) {
      return this.connecting
    }

    this.connecting = this.openWebSocket()

    try {
      await this.connecting
    } finally {
      this.connecting = null
    }
  }

  private async openWebSocket(): Promise<void> {
    const credential = await this.tradeFeed.authorize()
    const ws = new WebSocket(this.tradeFeed.endpoint())
    this.ws = ws

    ws.on("message", (data) => {
      const raw = this.toMessageText(data)
      const priceEvent = this.tradeFeed.decode(raw)

      if (priceEvent) {
        this.priceSubject.next(priceEvent)
      }
    })

    ws.on("close", (closeCode, reason) => {
      if (this.ws !== ws) {
        return
      }

      this.logger.warn(
        `Realtime feed WebSocket closed: ${closeCode} ${reason.toString()}`
      )
      this.ws = null
      this.credential = null
      this.subscribedStockCodes.clear()
      this.failedConnectionAttempts = 0
      this.statusSubject.next({
        type: "disconnected",
        data: {
          closeCode,
          reason: reason.toString(),
        },
      })
      this.scheduleConnectionAttempt()
    })

    ws.on("error", (error) => {
      this.logger.error("Realtime feed WebSocket error", error)
    })

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.off("open", handleOpen)
          ws.off("error", handleError)
          reject(new Error("Realtime feed WebSocket connection timed out"))
        }, CONNECT_TIMEOUT_MS)

        const handleOpen = () => {
          clearTimeout(timeout)
          ws.off("error", handleError)
          this.logger.log("Realtime feed WebSocket connected")
          resolve()
        }
        const handleError = (error: Error) => {
          clearTimeout(timeout)
          ws.off("open", handleOpen)
          reject(error)
        }

        ws.once("open", handleOpen)
        ws.once("error", handleError)
      })
    } catch (error) {
      if (this.ws === ws) {
        this.ws = null
        this.credential = null
        this.subscribedStockCodes.clear()
      }

      ws.removeAllListeners()
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.terminate()
      }

      throw error
    }

    this.credential = credential
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
      await this.ensureConnected()

      const latestStockCodes = this.registry.getActiveStockCodes()
      for (const stockCode of latestStockCodes) {
        await this.subscribeStockCode(stockCode)
      }

      const recoveredAfterFailure = this.failedConnectionAttempts > 0
      this.failedConnectionAttempts = 0
      this.cooldownUntil = 0

      if (recoveredAfterFailure) {
        this.statusSubject.next({
          type: "reconnected",
          data: {
            stockCodes: latestStockCodes,
          },
        })
      }

      this.logger.log(
        `Realtime feed connected and subscribed ${latestStockCodes.length} active stock code(s)`
      )
    } catch (error) {
      this.failedConnectionAttempts += 1
      this.logger.error(
        `Realtime feed connection attempt ${this.failedConnectionAttempts}/${RECONNECT_DELAYS_MS.length} failed`,
        error
      )

      if (this.failedConnectionAttempts >= RECONNECT_DELAYS_MS.length) {
        this.startCooldown()
        return
      }

      this.connectionAttempt = null
      this.scheduleConnectionAttempt()
    }
  }

  private startCooldown(): void {
    this.clearReconnectTimer()
    this.failedConnectionAttempts = 0
    this.cooldownUntil = Date.now() + COOLDOWN_MS

    const ws = this.ws
    this.ws = null
    this.credential = null
    this.subscribedStockCodes.clear()

    if (ws?.readyState === WebSocket.OPEN) {
      ws.close()
    } else if (ws?.readyState === WebSocket.CONNECTING) {
      ws.terminate()
    }

    this.statusSubject.next(this.createFeedUnavailableEvent(COOLDOWN_MS))
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return
    }

    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private toMessageText(data: WebSocket.RawData): string {
    if (isString(data)) {
      return data
    }

    if (Buffer.isBuffer(data)) {
      return data.toString("utf8")
    }

    if (isArrayBuffer(data)) {
      return Buffer.from(data).toString("utf8")
    }

    return Buffer.concat(data).toString("utf8")
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

  private sendSubscriptionMessage(
    action: "subscribe" | "unsubscribe",
    stockCode: string
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Realtime feed WebSocket is not open")
    }

    const credential = this.getCredential()
    const message =
      action === "subscribe"
        ? this.tradeFeed.subscribe({ credential, stockCode })
        : this.tradeFeed.unsubscribe({ credential, stockCode })

    this.ws.send(message)
  }

  private getCredential(): FeedCredential {
    if (!this.credential) {
      throw new Error("Realtime feed credential is missing")
    }

    return this.credential
  }
}
