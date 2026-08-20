import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { err, ok, type Result } from "neverthrow"
import { Observable, Subject } from "rxjs"
import type { AppEnv } from "../../../../config/env.validation"
import type {
  ExternalProviderError,
  ExternalStreamFailure,
} from "../../../error"
import { KisAuthorization } from "../authorization"
import { subscriptionKey, type KisWebSocketSubscription } from "./channel"
import { kisWebSocketFrameSchema, type KisWebSocketFrame } from "./schema"

const PROVIDER = "kis" as const
const OPEN_TIMEOUT_MS = 5_000

export type KisWebSocketConnectionState =
  | {
      readonly status: "connected"
      readonly provider: typeof PROVIDER
    }
  | {
      readonly status: "disconnected"
      readonly provider: typeof PROVIDER
      readonly closeCode: number
      readonly reason: string
    }

type IdleConnection = {
  readonly kind: "idle"
  readonly revision: number
}

type OpeningConnection = {
  readonly kind: "opening"
  readonly revision: number
  socket: WebSocket | null
  task: Promise<Result<OpenConnection, ExternalStreamFailure>> | null
}

type OpenConnection = {
  readonly kind: "open"
  readonly revision: number
  readonly socket: WebSocket
  readonly approvalKey: string
}

type Connection = IdleConnection | OpeningConnection | OpenConnection

@Injectable()
export class KisWebSocketConnection implements OnModuleDestroy {
  private readonly logger = new Logger(KisWebSocketConnection.name)
  private readonly frameEvents = new Subject<KisWebSocketFrame>()
  private readonly stateEvents = new Subject<KisWebSocketConnectionState>()
  private readonly activeSubscriptions = new Set<string>()
  private connection: Connection = { kind: "idle", revision: 0 }

  constructor(
    private readonly authorization: KisAuthorization,
    private readonly config: ConfigService<AppEnv, true>
  ) {}

  frames(): Observable<KisWebSocketFrame> {
    return this.frameEvents.asObservable()
  }

  states(): Observable<KisWebSocketConnectionState> {
    return this.stateEvents.asObservable()
  }

  async subscribe(
    subscription: KisWebSocketSubscription
  ): Promise<Result<void, ExternalStreamFailure>> {
    const connection = await this.openConnection()
    if (connection.isErr()) {
      return err(connection.error)
    }

    const key = subscriptionKey(subscription)
    if (this.activeSubscriptions.has(key)) {
      return ok(undefined)
    }

    const sent = this.send(connection.value, "1", subscription)
    if (sent.isErr()) {
      return sent
    }

    this.activeSubscriptions.add(key)
    return ok(undefined)
  }

  unsubscribe(
    subscription: KisWebSocketSubscription
  ): Result<void, ExternalStreamFailure> {
    const key = subscriptionKey(subscription)
    if (!this.activeSubscriptions.has(key)) {
      return ok(undefined)
    }

    if (this.connection.kind !== "open") {
      this.activeSubscriptions.delete(key)
      return ok(undefined)
    }

    const sent = this.send(this.connection, "2", subscription)
    if (sent.isErr()) {
      return sent
    }

    this.activeSubscriptions.delete(key)
    return ok(undefined)
  }

  close(): void {
    const current = this.connection
    const revision = current.revision + 1
    this.connection = { kind: "idle", revision }
    this.activeSubscriptions.clear()

    const socket = current.kind === "idle" ? null : current.socket
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      socket.close()
    }
  }

  onModuleDestroy(): void {
    this.close()
    this.frameEvents.complete()
    this.stateEvents.complete()
  }

  private openConnection(): Promise<
    Result<OpenConnection, ExternalStreamFailure>
  > {
    if (this.connection.kind === "open") {
      return Promise.resolve(ok(this.connection))
    }

    if (this.connection.kind === "opening" && this.connection.task) {
      return this.connection.task
    }

    const pending: OpeningConnection = {
      kind: "opening",
      revision: this.connection.revision + 1,
      socket: null,
      task: null,
    }
    this.connection = pending

    const task = this.establish(pending).then((result) => {
      if (this.connection !== pending) {
        if (result.isOk()) {
          result.value.socket.close()
        }
        return err(
          streamFailure("connect", "cancelled", "KIS WebSocket was closed")
        )
      }

      if (result.isErr()) {
        this.connection = { kind: "idle", revision: pending.revision }
        return result
      }

      this.connection = result.value
      this.stateEvents.next({ status: "connected", provider: PROVIDER })
      return result
    })
    pending.task = task
    return task
  }

  private async establish(
    pending: OpeningConnection
  ): Promise<Result<OpenConnection, ExternalStreamFailure>> {
    const approval = await this.approvalKey()
    if (approval.isErr()) {
      return err(approval.error)
    }

    if (this.connection !== pending) {
      return err(
        streamFailure("connect", "cancelled", "KIS WebSocket was closed")
      )
    }

    let socket: WebSocket
    try {
      socket = new WebSocket(this.config.getOrThrow("KIS_WS_URL"))
    } catch (cause) {
      return err(
        streamFailure(
          "connect",
          "connection",
          failureMessage(cause, "KIS WebSocket connection failed")
        )
      )
    }

    pending.socket = socket
    this.observe(socket, pending.revision)

    const opened = await waitForOpen(socket)
    if (opened.isErr()) {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close()
      }
      return err(opened.error)
    }

    if (this.connection !== pending) {
      socket.close()
      return err(
        streamFailure("connect", "cancelled", "KIS WebSocket was closed")
      )
    }

    if (socket.readyState !== WebSocket.OPEN) {
      return err(
        streamFailure(
          "connect",
          "connection",
          "KIS WebSocket closed while connecting"
        )
      )
    }

    return ok({
      kind: "open",
      revision: pending.revision,
      socket,
      approvalKey: approval.value,
    })
  }

  private async approvalKey(): Promise<Result<string, ExternalStreamFailure>> {
    let approval: Awaited<ReturnType<KisAuthorization["approvalKey"]>>

    try {
      approval = await this.authorization.approvalKey()
    } catch (cause) {
      return err(
        streamFailure(
          "authorize",
          "provider",
          failureMessage(cause, "KIS WebSocket authorization failed")
        )
      )
    }

    return approval.match(
      (value) => ok(value.approval_key),
      (upstream) =>
        err(streamFailure("authorize", "provider", upstream.message, upstream))
    )
  }

  private observe(socket: WebSocket, revision: number): void {
    socket.addEventListener("message", (message) => {
      if (
        this.connection.kind !== "open" ||
        this.connection.revision !== revision ||
        this.connection.socket !== socket ||
        typeof message.data !== "string"
      ) {
        return
      }

      const frame = kisWebSocketFrameSchema.safeParse(message.data)
      if (frame.success && frame.data) {
        this.frameEvents.next(frame.data)
      }
    })

    socket.addEventListener("close", (closed) => {
      if (
        this.connection.kind !== "open" ||
        this.connection.revision !== revision ||
        this.connection.socket !== socket
      ) {
        return
      }

      this.connection = { kind: "idle", revision }
      this.activeSubscriptions.clear()
      this.stateEvents.next({
        status: "disconnected",
        provider: PROVIDER,
        closeCode: closed.code,
        reason: closed.reason,
      })
    })

    socket.addEventListener("error", () => {
      this.logger.error("KIS WebSocket reported an error")
    })
  }

  private send(
    connection: OpenConnection,
    action: "1" | "2",
    subscription: KisWebSocketSubscription
  ): Result<void, ExternalStreamFailure> {
    const operation = action === "1" ? "subscribe" : "unsubscribe"
    if (
      this.connection !== connection ||
      connection.socket.readyState !== WebSocket.OPEN
    ) {
      return err(
        streamFailure(
          operation,
          "not_connected",
          "KIS WebSocket is not connected"
        )
      )
    }

    const message = JSON.stringify({
      header: {
        approval_key: connection.approvalKey,
        custtype: "P",
        tr_type: action,
        "content-type": "utf-8",
      },
      body: {
        input: {
          tr_id: subscription.trId,
          tr_key: subscription.trKey,
        },
      },
    })

    try {
      connection.socket.send(message)
      return ok(undefined)
    } catch (cause) {
      return err(
        streamFailure(
          operation,
          "send",
          failureMessage(cause, "KIS WebSocket request failed")
        )
      )
    }
  }
}

function waitForOpen(
  socket: WebSocket
): Promise<Result<void, ExternalStreamFailure>> {
  return new Promise((resolve) => {
    let settled = false

    const settle = (result: Result<void, ExternalStreamFailure>) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      socket.removeEventListener("open", opened)
      socket.removeEventListener("error", failed)
      socket.removeEventListener("close", closed)
      resolve(result)
    }
    const opened = () => settle(ok(undefined))
    const failed = () =>
      settle(
        err(
          streamFailure(
            "connect",
            "connection",
            "KIS WebSocket connection failed"
          )
        )
      )
    const closed = () =>
      settle(
        err(
          streamFailure(
            "connect",
            "connection",
            "KIS WebSocket closed before connecting"
          )
        )
      )
    const timeout = setTimeout(
      () =>
        settle(
          err(
            streamFailure(
              "connect",
              "timeout",
              "KIS WebSocket connection timed out"
            )
          )
        ),
      OPEN_TIMEOUT_MS
    )

    socket.addEventListener("open", opened, { once: true })
    socket.addEventListener("error", failed, { once: true })
    socket.addEventListener("close", closed, { once: true })
  })
}

function streamFailure(
  operation: ExternalStreamFailure["operation"],
  reason: ExternalStreamFailure["reason"],
  message: string,
  upstream?: ExternalProviderError
): ExternalStreamFailure {
  return {
    type: "external.stream_failure",
    provider: PROVIDER,
    operation,
    reason,
    message,
    ...(upstream ? { upstream } : {}),
  }
}

function failureMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback
}
