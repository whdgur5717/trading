import { ok } from "neverthrow"
import { Subject } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ExternalService } from "../../../external/external.service"
import type { ExternalStreamState, TradeTick } from "../../../external/schema"
import type { RealtimeEvent } from "../../event"
import { LocalRealtimeBroker } from "./local-realtime-broker"

describe("LocalRealtimeBroker", () => {
  const subscribeTrades = vi.fn().mockResolvedValue(ok(undefined))
  const unsubscribeTrades = vi.fn().mockReturnValue(ok(undefined))
  let ticks: Subject<TradeTick>
  let states: Subject<ExternalStreamState>
  let broker: LocalRealtimeBroker

  beforeEach(() => {
    vi.clearAllMocks()
    subscribeTrades.mockResolvedValue(ok(undefined))
    unsubscribeTrades.mockReturnValue(ok(undefined))
    ticks = new Subject<TradeTick>()
    states = new Subject<ExternalStreamState>()
    const external = {
      tradeTicks: () => ticks,
      tradeStreamState: () => states,
      subscribeTrades,
      unsubscribeTrades,
    } as unknown as ExternalService
    broker = new LocalRealtimeBroker(external)
  })

  it("같은 종목을 보는 소비자들은 외부 구독 하나를 공유한다", async () => {
    const first = broker.watch(["005930"]).subscribe()
    const second = broker.watch(["005930"]).subscribe()

    await vi.waitFor(() => expect(subscribeTrades).toHaveBeenCalledOnce())
    expect(subscribeTrades).toHaveBeenCalledWith("005930")

    first.unsubscribe()
    expect(unsubscribeTrades).not.toHaveBeenCalled()

    second.unsubscribe()
    expect(unsubscribeTrades).toHaveBeenCalledOnce()
    expect(unsubscribeTrades).toHaveBeenCalledWith("005930")
  })

  it("소비자가 요청한 종목의 체결만 전달한다", async () => {
    const samsungEvents: RealtimeEvent[] = []
    const hynixEvents: RealtimeEvent[] = []
    const samsung = broker.watch(["005930"]).subscribe((event) => {
      samsungEvents.push(event)
    })
    const hynix = broker.watch(["000660"]).subscribe((event) => {
      hynixEvents.push(event)
    })

    await vi.waitFor(() => expect(subscribeTrades).toHaveBeenCalledTimes(2))

    const trade: TradeTick = {
      symbol: "000660",
      price: 198000,
      executedAt: "2026-05-15T10:30:15+09:00",
    }
    ticks.next(trade)

    expect(samsungEvents).toEqual([{ type: "subscribed", symbol: "005930" }])
    expect(hynixEvents).toEqual([
      { type: "subscribed", symbol: "000660" },
      { type: "trade", trade },
    ])

    samsung.unsubscribe()
    hynix.unsubscribe()
  })

  it("외부 연결 상태를 소비자용 실시간 이벤트로 변환한다", () => {
    const events: RealtimeEvent[] = []
    const watcher = broker.watch(["005930"]).subscribe((event) => {
      events.push(event)
    })

    states.next({ status: "connected", provider: "kis" })
    states.next({
      status: "disconnected",
      provider: "kis",
      closeCode: 1006,
      reason: "network",
    })
    states.next({ status: "connected", provider: "kis" })
    states.next({
      status: "unavailable",
      provider: "kis",
      message: "upstream timeout",
      retryAfterMs: 300000,
    })

    expect(events).toEqual([
      { type: "subscribed", symbol: "005930" },
      {
        type: "disconnected",
        provider: "kis",
        closeCode: 1006,
        reason: "network",
      },
      {
        type: "reconnected",
        provider: "kis",
        symbols: ["005930"],
      },
      {
        type: "unavailable",
        provider: "kis",
        message: "upstream timeout",
        retryAfterMs: 300000,
      },
    ])

    watcher.unsubscribe()
  })
})
