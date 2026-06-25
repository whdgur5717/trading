import { Logger } from "@nestjs/common"
import { err, ok, type Result } from "neverthrow"
import WebSocket from "ws"
import type {
  FeedCredential,
  RealtimeTradeFeedPort,
  TradeTick,
} from "../market/port/realtime"
import type { RealtimeConnectionError } from "./realtime-connection-error"
import { webSocketDataAsText } from "./websocket-message"

const CONNECT_TIMEOUT_MS = 5_000

type RealtimeFeedSessionEvents = {
  readonly onPrice: (event: TradeTick) => void
  readonly onDisconnected: (event: {
    readonly closeCode: number
    readonly reason: string
  }) => void
  readonly onClosed: () => void
}

export class RealtimeFeedSession {
  private readonly logger = new Logger(RealtimeFeedSession.name)
  private readonly subscribedStockCodes = new Set<string>()
  private ws: WebSocket | null = null
  private connecting: Promise<Result<void, RealtimeConnectionError>> | null =
    null
  private credential: FeedCredential | null = null

  constructor(
    private readonly tradeFeed: RealtimeTradeFeedPort,
    private readonly events: RealtimeFeedSessionEvents
  ) {}

  async connect(): Promise<Result<void, RealtimeConnectionError>> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return ok(undefined)
    }

    if (this.connecting) {
      return this.connecting
    }

    this.connecting = this.openWebSocket()

    try {
      return await this.connecting
    } finally {
      this.connecting = null
    }
  }

  async subscribe(
    stockCode: string
  ): Promise<Result<void, RealtimeConnectionError>> {
    const connected = await this.connect()

    if (connected.isErr()) {
      return connected
    }

    if (this.subscribedStockCodes.has(stockCode)) {
      return ok(undefined)
    }

    const sent = this.sendSubscriptionMessage("subscribe", stockCode)

    if (sent.isErr()) {
      return sent
    }

    this.subscribedStockCodes.add(stockCode)
    return ok(undefined)
  }

  unsubscribe(stockCode: string): Result<void, RealtimeConnectionError> {
    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      !this.subscribedStockCodes.has(stockCode)
    ) {
      return ok(undefined)
    }

    const sent = this.sendSubscriptionMessage("unsubscribe", stockCode)
    this.subscribedStockCodes.delete(stockCode)
    return sent
  }

  close(): void {
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

  private async openWebSocket(): Promise<
    Result<void, RealtimeConnectionError>
  > {
    const credential = await this.tradeFeed.authorize()
    if (credential.isErr()) {
      return err({
        type: "feed-authorization",
        error: credential.error,
      })
    }

    const ws = new WebSocket(this.tradeFeed.endpoint())
    this.ws = ws

    ws.on("message", (data) => {
      const raw = webSocketDataAsText(data)
      const priceEvent = this.tradeFeed.decode(raw)

      if (priceEvent) {
        this.events.onPrice(priceEvent)
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
      this.events.onDisconnected({
        closeCode,
        reason: reason.toString(),
      })
      this.events.onClosed()
    })

    ws.on("error", (error) => {
      this.logger.error("Realtime feed WebSocket error", error)
    })

    const opened = await this.waitUntilOpen(ws)
    if (opened.isErr()) {
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

      return opened
    }

    this.credential = credential.value
    return ok(undefined)
  }

  private sendSubscriptionMessage(
    action: "subscribe" | "unsubscribe",
    stockCode: string
  ): Result<void, RealtimeConnectionError> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return err({
        type: "websocket-not-open",
        message: "Realtime feed WebSocket is not open",
      })
    }

    const credential = this.getCredential()
    if (credential.isErr()) {
      return err(credential.error)
    }

    const message =
      action === "subscribe"
        ? this.tradeFeed.subscribe({ credential: credential.value, stockCode })
        : this.tradeFeed.unsubscribe({
            credential: credential.value,
            stockCode,
          })

    try {
      this.ws.send(message)
      return ok(undefined)
    } catch (error) {
      return err({
        type: "websocket-send-failed",
        message:
          error instanceof Error
            ? error.message
            : "Realtime feed WebSocket send failed",
      })
    }
  }

  private getCredential(): Result<FeedCredential, RealtimeConnectionError> {
    if (!this.credential) {
      return err({
        type: "credential-missing",
        message: "Realtime feed credential is missing",
      })
    }

    return ok(this.credential)
  }

  private waitUntilOpen(
    ws: WebSocket
  ): Promise<Result<void, RealtimeConnectionError>> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.off("open", handleOpen)
        ws.off("error", handleError)
        resolve(
          err({
            type: "websocket-timeout",
            message: "Realtime feed WebSocket connection timed out",
          })
        )
      }, CONNECT_TIMEOUT_MS)

      const handleOpen = () => {
        clearTimeout(timeout)
        ws.off("error", handleError)
        this.logger.log("Realtime feed WebSocket connected")
        resolve(ok(undefined))
      }
      const handleError = (error: Error) => {
        clearTimeout(timeout)
        ws.off("open", handleOpen)
        resolve(
          err({
            type: "websocket-error",
            message: error.message,
          })
        )
      }

      ws.once("open", handleOpen)
      ws.once("error", handleError)
    })
  }
}
