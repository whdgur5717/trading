import { ok } from "neverthrow"
import { Subject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { KisWebSocketClient } from "../client"
import type {
  KisWebSocketConnection,
  KisWebSocketConnectionState,
} from "../connection"
import type { KisWebSocketFrame } from "../schema"
import { KisTradeClient } from "./client"

describe("KisTradeClient", () => {
  let frames: Subject<KisWebSocketFrame>
  let states: Subject<KisWebSocketConnectionState>
  let subscribe: ReturnType<typeof vi.fn>
  let unsubscribe: ReturnType<typeof vi.fn>
  let websocket: KisWebSocketClient
  let trades: KisTradeClient

  beforeEach(() => {
    frames = new Subject<KisWebSocketFrame>()
    states = new Subject<KisWebSocketConnectionState>()
    subscribe = vi.fn().mockResolvedValue(ok(undefined))
    unsubscribe = vi.fn().mockReturnValue(ok(undefined))
    const connection = {
      frames: () => frames,
      states: () => states,
      subscribe,
      unsubscribe,
      close: vi.fn(),
    } as unknown as KisWebSocketConnection
    websocket = new KisWebSocketClient(connection)
    trades = new KisTradeClient(websocket)
  })

  afterEach(() => {
    websocket.onModuleDestroy()
  })

  it("체결 channel이 종목을 KIS 체결 구독으로 변환한다", async () => {
    const result = await trades.subscribe("005930")

    expect(result.isOk()).toBe(true)
    expect(subscribe).toHaveBeenCalledWith({
      trId: "H0STCNT0",
      trKey: "005930",
    })
  })

  it("체결 channel이 자신의 원시 프레임만 체결 데이터로 변환한다", () => {
    const ticks: unknown[] = []
    trades.ticks().subscribe((tick) => ticks.push(tick))
    const values = ["005930", "103015", "78000", ...Array(30).fill("")]
    values.push("20260515")

    frames.next({
      encrypted: false,
      trId: "H0STASP0",
      count: 1,
      payload: values.join("^"),
    })
    frames.next({
      encrypted: false,
      trId: "H0STCNT0",
      count: 1,
      payload: values.join("^"),
    })

    expect(ticks).toEqual([
      {
        symbol: "005930",
        price: 78000,
        executedAt: "2026-05-15T10:30:15+09:00",
      },
    ])
  })
})
