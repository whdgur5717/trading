import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common"
import {
  CircuitState,
  ConsecutiveBreaker,
  IterableBackoff,
  circuitBreaker,
  handleAll,
  retry,
  wrap,
  type IDisposable,
} from "cockatiel"
import { err, ok, type Result } from "neverthrow"
import { filter, map, Observable, Subject, Subscription } from "rxjs"
import type { ExternalStreamFailure } from "../../../error"
import type { ExternalStreamState } from "../../../schema"
import type { KisWebSocketChannel, KisWebSocketSubscription } from "./channel"
import { subscriptionKey } from "./channel"
import { KisWebSocketConnection } from "./connection"

const PROVIDER = "kis" as const
const RETRY_DELAYS_MS = [1_000, 3_000] as const
const CIRCUIT_OPEN_MS = 5 * 60_000

type DesiredSubscription = {
  subscription: KisWebSocketSubscription
  consumers: number
  activation: Promise<Result<void, ExternalStreamFailure>> | null
}

@Injectable()
export class KisWebSocketClient implements OnModuleDestroy {
  private readonly logger = new Logger(KisWebSocketClient.name)
  private desiredSubscriptions = new Map<string, DesiredSubscription>()
  private readonly stateEvents = new Subject<ExternalStreamState>()
  private readonly connectionEvents = new Subscription()
  private readonly handled = handleAll.orWhenResult(isFailedResult)
  private readonly retries = retry(this.handled, {
    maxAttempts: RETRY_DELAYS_MS.length,
    backoff: new IterableBackoff(RETRY_DELAYS_MS),
  }).dangerouslyUnref()
  private readonly breaker = circuitBreaker(this.handled, {
    breaker: new ConsecutiveBreaker(1),
    halfOpenAfter: CIRCUIT_OPEN_MS,
  })
  private readonly policy = wrap(this.breaker, this.retries)
  private readonly policyEvents: IDisposable[]
  private recovery: Promise<void> | null = null
  private openedAt = 0
  private lastFailure: ExternalStreamFailure | null = null
  private available = false
  private destroyed = false

  constructor(private readonly connection: KisWebSocketConnection) {
    this.connectionEvents.add(
      this.connection.states().subscribe((state) => {
        if (state.status === "disconnected") {
          this.available = false
          this.stateEvents.next(state)
          this.requestRecovery()
        }
      })
    )

    this.policyEvents = [
      this.retries.onRetry(({ attempt, delay }) => {
        this.logger.warn(
          `Retrying KIS WebSocket ${attempt}/${RETRY_DELAYS_MS.length} in ${delay}ms`
        )
      }),
      this.breaker.onBreak(() => {
        this.openedAt = Date.now()
        this.logger.error(
          `KIS WebSocket circuit opened for ${CIRCUIT_OPEN_MS}ms`
        )
      }),
      this.breaker.onReset(() => {
        this.openedAt = 0
        this.lastFailure = null
        this.logger.log("KIS WebSocket circuit closed")
      }),
    ]
  }

  events<Input, Event>(
    channel: KisWebSocketChannel<Input, Event>
  ): Observable<Event> {
    return this.connection.frames().pipe(
      filter((frame) => channel.accepts(frame)),
      map((frame) => channel.decode(frame)),
      filter((event): event is Event => event !== null)
    )
  }

  states(): Observable<ExternalStreamState> {
    return this.stateEvents.asObservable()
  }

  async subscribe<Input, Event>(
    channel: KisWebSocketChannel<Input, Event>,
    input: Input
  ): Promise<Result<void, ExternalStreamFailure>> {
    const subscription = channel.subscription(input)
    const key = subscriptionKey(subscription)
    const existing = this.desiredSubscriptions.get(key)
    if (existing) {
      existing.consumers += 1
      return existing.activation ?? ok(undefined)
    }

    const desired: DesiredSubscription = {
      subscription,
      consumers: 1,
      activation: null,
    }
    this.desiredSubscriptions.set(key, desired)

    const activation = this.execute("subscribe", async () => {
      if (this.desiredSubscriptions.get(key) !== desired) {
        return ok(undefined)
      }

      const subscribed = await this.connection.subscribe(subscription)
      if (
        subscribed.isErr() ||
        this.desiredSubscriptions.get(key) === desired
      ) {
        return subscribed
      }

      return this.connection.unsubscribe(subscription)
    })
    desired.activation = activation
    const result = await activation

    if (result.isErr() && this.desiredSubscriptions.get(key) === desired) {
      this.desiredSubscriptions.delete(key)
      if (this.desiredSubscriptions.size === 0) {
        this.connection.close()
      }
    }

    if (
      result.isOk() &&
      !this.recovery &&
      this.desiredSubscriptions.get(key) === desired
    ) {
      this.publishConnected()
    }
    return result
  }

  unsubscribe<Input, Event>(
    channel: KisWebSocketChannel<Input, Event>,
    input: Input
  ): Result<void, ExternalStreamFailure> {
    const subscription = channel.subscription(input)
    const key = subscriptionKey(subscription)
    const desired = this.desiredSubscriptions.get(key)
    if (!desired) {
      return ok(undefined)
    }

    if (desired.consumers > 1) {
      desired.consumers -= 1
      return ok(undefined)
    }

    this.desiredSubscriptions.delete(key)
    const unsubscribed = this.connection.unsubscribe(subscription)

    if (this.desiredSubscriptions.size === 0) {
      this.connection.close()
    }

    return unsubscribed
  }

  onModuleDestroy(): void {
    this.destroyed = true
    this.close()
    this.connectionEvents.unsubscribe()
    for (const event of this.policyEvents) {
      event.dispose()
    }
    this.stateEvents.complete()
  }

  private close(): void {
    this.desiredSubscriptions.clear()
    this.available = false
    this.connection.close()
  }

  private requestRecovery(): void {
    if (
      this.destroyed ||
      this.recovery ||
      this.desiredSubscriptions.size === 0
    ) {
      return
    }

    this.recovery = this.restoreSubscriptions().then(() => {
      this.recovery = null
    })
  }

  private async restoreSubscriptions(): Promise<void> {
    const restored = await this.execute("subscribe", async () => {
      for (const [key, desired] of this.desiredSubscriptions) {
        const subscribed = await this.connection.subscribe(desired.subscription)
        if (subscribed.isErr()) {
          return subscribed
        }

        if (!this.desiredSubscriptions.has(key)) {
          const unsubscribed = this.connection.unsubscribe(desired.subscription)
          if (unsubscribed.isErr()) {
            return unsubscribed
          }
        }
      }

      return ok(undefined)
    })

    if (restored.isOk() && this.desiredSubscriptions.size > 0) {
      this.publishConnected()
    }
  }

  private async execute(
    operation: ExternalStreamFailure["operation"],
    action: () => Promise<Result<void, ExternalStreamFailure>>
  ): Promise<Result<void, ExternalStreamFailure>> {
    let operationFailure: ExternalStreamFailure | null = null

    try {
      const result = await this.policy.execute(async () => {
        const attempt = await action()
        if (attempt.isErr()) {
          operationFailure = attempt.error
          this.lastFailure = attempt.error
        }
        return attempt
      })

      if (result.isErr()) {
        this.publishUnavailable(result.error)
      } else {
        this.lastFailure = null
      }
      return result
    } catch (cause) {
      const failure =
        operationFailure ??
        this.lastFailure ??
        streamFailure(
          operation,
          this.breaker.state === CircuitState.Open
            ? "circuit_open"
            : "connection",
          failureMessage(cause)
        )
      this.publishUnavailable(failure)
      return err(failure)
    }
  }

  private publishUnavailable(failure: ExternalStreamFailure): void {
    this.available = false
    this.stateEvents.next({
      status: "unavailable",
      provider: PROVIDER,
      message: failure.message,
      retryAfterMs: this.cooldownRemaining(),
    })
  }

  private publishConnected(): void {
    if (this.available) {
      return
    }

    this.available = true
    this.stateEvents.next({ status: "connected", provider: PROVIDER })
  }

  private cooldownRemaining(): number {
    if (this.breaker.state !== CircuitState.Open || this.openedAt === 0) {
      return 0
    }

    return Math.max(0, CIRCUIT_OPEN_MS - (Date.now() - this.openedAt))
  }
}

function isFailedResult(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as { isErr?: () => boolean }
  return candidate.isErr?.() ?? false
}

function streamFailure(
  operation: ExternalStreamFailure["operation"],
  reason: ExternalStreamFailure["reason"],
  message: string
): ExternalStreamFailure {
  return {
    type: "external.stream_failure",
    provider: PROVIDER,
    operation,
    reason,
    message,
  }
}

function failureMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "KIS WebSocket is unavailable"
}
