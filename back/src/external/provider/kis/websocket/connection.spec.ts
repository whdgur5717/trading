import type { ConfigService } from "@nestjs/config"
import { ok } from "neverthrow"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AppEnv } from "../../../../config/env.validation"
import type { KisAuthorization } from "../authorization"
import type { KisWebSocketSubscription } from "./channel"
import { KisWebSocketConnection } from "./connection"

class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  static readonly instances: FakeWebSocket[] = []

  readonly sent: string[] = []
  readyState = FakeWebSocket.CONNECTING

  constructor(readonly url: string) {
    super()
    FakeWebSocket.instances.push(this)
  }

  send(message: string): void {
    this.sent.push(message)
  }

  close(): void {
    this.disconnect(1000, "closed")
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN
    this.dispatchEvent(new Event("open"))
  }

  message(data: string): void {
    const event = new Event("message")
    Object.defineProperty(event, "data", { value: data })
    this.dispatchEvent(event)
  }

  disconnect(code: number, reason: string): void {
    this.readyState = FakeWebSocket.CLOSED
    const event = new Event("close")
    Object.defineProperties(event, {
      code: { value: code },
      reason: { value: reason },
    })
    this.dispatchEvent(event)
  }
}

describe("KisWebSocketConnection", () => {
  const authorization = {
    approvalKey: vi.fn().mockResolvedValue(ok({ approval_key: "approval" })),
  } as unknown as KisAuthorization
  const config = {
    getOrThrow(key: keyof AppEnv) {
      return { KIS_WS_URL: "ws://kis.test/realtime" }[key]
    },
  } as ConfigService<AppEnv, true>
  const subscription: KisWebSocketSubscription = {
    trId: "H0STCNT0",
    trKey: "005930",
  }

  beforeEach(() => {
    FakeWebSocket.instances.length = 0
    vi.stubGlobal("WebSocket", FakeWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("하나의 KIS 연결에서 임의의 구독 프레임과 수신 프레임을 처리한다", async () => {
    const connection = new KisWebSocketConnection(authorization, config)
    const states: unknown[] = []
    const frames: unknown[] = []
    connection.states().subscribe((state) => states.push(state))
    connection.frames().subscribe((frame) => frames.push(frame))

    const subscribed = connection.subscribe(subscription)
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1))
    const socket = FakeWebSocket.instances[0]
    socket.open()

    await expect(subscribed).resolves.toSatisfy((result) => result.isOk())
    expect(JSON.parse(socket.sent[0])).toEqual({
      header: {
        approval_key: "approval",
        custtype: "P",
        tr_type: "1",
        "content-type": "utf-8",
      },
      body: {
        input: { tr_id: "H0STCNT0", tr_key: "005930" },
      },
    })

    socket.message("0|H0STCNT0|001|raw^payload")
    expect(frames).toEqual([
      {
        encrypted: false,
        trId: "H0STCNT0",
        count: 1,
        payload: "raw^payload",
      },
    ])
    expect(states).toEqual([{ status: "connected", provider: "kis" }])

    socket.disconnect(1006, "network")
    expect(states).toEqual([
      { status: "connected", provider: "kis" },
      {
        status: "disconnected",
        provider: "kis",
        closeCode: 1006,
        reason: "network",
      },
    ])

    connection.onModuleDestroy()
  })

  it("서로 다른 TR 구독을 동일한 물리 연결에 전송한다", async () => {
    const connection = new KisWebSocketConnection(authorization, config)
    const first = connection.subscribe(subscription)
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1))
    const socket = FakeWebSocket.instances[0]
    socket.open()
    await first

    await connection.subscribe({ trId: "H0STASP0", trKey: "005930" })

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(socket.sent.map((message) => JSON.parse(message))).toEqual([
      expect.objectContaining({
        body: { input: { tr_id: "H0STCNT0", tr_key: "005930" } },
      }),
      expect.objectContaining({
        body: { input: { tr_id: "H0STASP0", tr_key: "005930" } },
      }),
    ])

    connection.onModuleDestroy()
  })

  it("승인키 발급 거절을 구조화된 실패로 반환한다", async () => {
    const rejectedAuthorization = {
      approvalKey: vi.fn().mockRejectedValue("authorization unavailable"),
    } as unknown as KisAuthorization
    const connection = new KisWebSocketConnection(rejectedAuthorization, config)

    const result = await connection.subscribe(subscription)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toMatchObject({
      type: "external.stream_failure",
      provider: "kis",
      operation: "authorize",
      reason: "provider",
    })
    expect(FakeWebSocket.instances).toHaveLength(0)

    connection.onModuleDestroy()
  })
})
