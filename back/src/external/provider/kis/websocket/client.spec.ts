import { err, ok, type Result } from "neverthrow"
import { Subject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ExternalStreamFailure } from "../../../error"
import type { ExternalStreamState } from "../../../schema"
import { KisWebSocketClient } from "./client"
import type { KisWebSocketChannel } from "./channel"
import type {
  KisWebSocketConnection,
  KisWebSocketConnectionState,
} from "./connection"
import type { KisWebSocketFrame } from "./schema"

const testChannel: KisWebSocketChannel<string, string> = {
  subscription: (key) => ({ trId: "TEST_TR", trKey: key }),
  accepts: (frame) => frame.trId === "TEST_TR",
  decode: (frame) => frame.payload,
}

const otherChannel: KisWebSocketChannel<string, string> = {
  subscription: (key) => ({ trId: "OTHER_TR", trKey: key }),
  accepts: (frame) => frame.trId === "OTHER_TR",
  decode: (frame) => frame.payload,
}

describe("KisWebSocketClient", () => {
  let frames: Subject<KisWebSocketFrame>
  let connectionStates: Subject<KisWebSocketConnectionState>
  let subscribe: ReturnType<typeof vi.fn>
  let unsubscribe: ReturnType<typeof vi.fn>
  let close: ReturnType<typeof vi.fn>
  let client: KisWebSocketClient

  beforeEach(() => {
    vi.useFakeTimers()
    frames = new Subject<KisWebSocketFrame>()
    connectionStates = new Subject<KisWebSocketConnectionState>()
    subscribe = vi.fn().mockResolvedValue(ok(undefined))
    unsubscribe = vi.fn().mockReturnValue(ok(undefined))
    close = vi.fn()
    const connection = {
      frames: () => frames,
      states: () => connectionStates,
      subscribe,
      unsubscribe,
      close,
    } as unknown as KisWebSocketConnection
    client = new KisWebSocketClient(connection)
  })

  afterEach(() => {
    client.onModuleDestroy()
    vi.useRealTimers()
  })

  it("channel이 허용하고 해석한 프레임만 전달한다", () => {
    const events: string[] = []
    client.events(testChannel).subscribe((event) => events.push(event))

    frames.next({
      encrypted: false,
      trId: "OTHER_TR",
      count: 1,
      payload: "ignored",
    })
    frames.next({
      encrypted: false,
      trId: "TEST_TR",
      count: 1,
      payload: "accepted",
    })

    expect(events).toEqual(["accepted"])
  })

  it("연결 실패를 두 번 재시도한 뒤 일정 시간 새 연결을 막는다", async () => {
    const failure: ExternalStreamFailure = {
      type: "external.stream_failure",
      provider: "kis",
      operation: "connect",
      reason: "timeout",
      message: "upstream timeout",
    }
    subscribe.mockResolvedValue(err(failure))
    const streamStates: ExternalStreamState[] = []
    client.states().subscribe((state) => streamStates.push(state))

    const failedSubscription = client.subscribe(testChannel, "first")
    await vi.runAllTimersAsync()

    expect((await failedSubscription).isErr()).toBe(true)
    expect(subscribe).toHaveBeenCalledTimes(3)
    expect(streamStates.at(-1)).toEqual({
      status: "unavailable",
      provider: "kis",
      message: "upstream timeout",
      retryAfterMs: 300000,
    })

    const blockedSubscription = await client.subscribe(testChannel, "second")
    expect(blockedSubscription.isErr()).toBe(true)
    expect(subscribe).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(300000)
    subscribe.mockResolvedValue(ok(undefined))
    const recoveredSubscription = await client.subscribe(testChannel, "second")

    expect(recoveredSubscription.isOk()).toBe(true)
    expect(subscribe).toHaveBeenCalledTimes(4)
  })

  it("연결이 끊기면 모든 channel 구독을 복구한다", async () => {
    const streamStates: ExternalStreamState[] = []
    client.states().subscribe((state) => streamStates.push(state))
    await client.subscribe(testChannel, "first")
    await client.subscribe(otherChannel, "second")
    expect(subscribe).toHaveBeenCalledTimes(2)

    connectionStates.next({
      status: "disconnected",
      provider: "kis",
      closeCode: 1006,
      reason: "network",
    })
    await vi.runAllTimersAsync()

    expect(subscribe).toHaveBeenCalledTimes(4)
    expect(subscribe).toHaveBeenNthCalledWith(3, {
      trId: "TEST_TR",
      trKey: "first",
    })
    expect(subscribe).toHaveBeenNthCalledWith(4, {
      trId: "OTHER_TR",
      trKey: "second",
    })
    expect(streamStates).toEqual([
      { status: "connected", provider: "kis" },
      {
        status: "disconnected",
        provider: "kis",
        closeCode: 1006,
        reason: "network",
      },
      { status: "connected", provider: "kis" },
    ])
  })

  it("마지막 구독이 사라지면 공통 연결을 닫는다", async () => {
    await client.subscribe(testChannel, "first")

    const result = client.unsubscribe(testChannel, "first")

    expect(result.isOk()).toBe(true)
    expect(unsubscribe).toHaveBeenCalledWith({
      trId: "TEST_TR",
      trKey: "first",
    })
    expect(close).toHaveBeenCalledOnce()
  })

  it("연결 중 수요가 사라지면 연결 완료 상태를 노출하지 않는다", async () => {
    let completeSubscription: (
      result: Result<void, ExternalStreamFailure>
    ) => void = () => undefined
    subscribe.mockReturnValue(
      new Promise<Result<void, ExternalStreamFailure>>((resolve) => {
        completeSubscription = resolve
      })
    )
    const streamStates: ExternalStreamState[] = []
    client.states().subscribe((state) => streamStates.push(state))

    const pending = client.subscribe(testChannel, "first")
    client.unsubscribe(testChannel, "first")
    completeSubscription(ok(undefined))
    await pending

    expect(streamStates).toEqual([])
  })
})
