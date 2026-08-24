import { err, ok } from "neverthrow"
import { Observable, Subject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { externalErrors } from "../external/error"
import type { ExternalService } from "../external/external.service"
import type { TradeStreamEvent } from "../external/schema"
import { REALTIME_ERRORS, type RealtimeEvent } from "./event"
import { RealtimeService } from "./realtime.service"

describe("RealtimeService", () => {
  const marketDay = vi.fn()
  const tradeStream = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-21T07:59:59+09:00"))
    marketDay.mockResolvedValue(
      ok({
        date: "2026-08-21",
        isBusinessDay: true,
        isTradingDay: true,
        isOpenDay: true,
        isSettlementDay: true,
      })
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("장 구간을 전달하고 열린 구간 전체에서 외부 구독 하나를 유지한다", async () => {
    let releases = 0
    tradeStream.mockReturnValue(
      new Observable<TradeStreamEvent>(() => () => {
        releases += 1
      })
    )
    const service = createService()
    const events: RealtimeEvent[] = []
    const watcher = service.watch(["005930"]).subscribe((event) => {
      events.push(event)
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(events).toEqual([
      { type: "subscribed", symbol: "005930" },
      { type: "market", session: "CLOSED" },
    ])
    expect(tradeStream).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1_000)
    expect(events.at(-1)).toEqual({
      type: "market",
      session: "PRE_MARKET",
    })
    expect(tradeStream).toHaveBeenCalledOnce()
    expect(tradeStream).toHaveBeenCalledWith(["005930"])

    await vi.advanceTimersByTimeAsync(60 * 60 * 1_000)
    expect(events.at(-1)).toEqual({
      type: "market",
      session: "REGULAR_MARKET",
    })
    expect(tradeStream).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(6.5 * 60 * 60 * 1_000)
    expect(events.at(-1)).toEqual({
      type: "market",
      session: "AFTER_MARKET",
    })
    expect(tradeStream).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(4.5 * 60 * 60 * 1_000 + 1_000)
    expect(events.at(-1)).toEqual({ type: "market", session: "CLOSED" })
    expect(releases).toBe(1)
    expect(marketDay).toHaveBeenCalledOnce()

    watcher.unsubscribe()
  })

  it("체결 스트림 이벤트를 공급자 정보 없이 전달한다", async () => {
    vi.setSystemTime(new Date("2026-08-21T10:00:00+09:00"))
    const source = new Subject<TradeStreamEvent>()
    tradeStream.mockReturnValue(source)
    const events: RealtimeEvent[] = []
    const watcher = createService()
      .watch(["005930"])
      .subscribe((event) => events.push(event))

    await vi.advanceTimersByTimeAsync(0)
    source.next({
      type: "trade",
      trade: {
        symbol: "005930",
        price: 78000,
        executedAt: "2026-05-15T10:30:15+09:00",
      },
    })
    source.next({ type: "disconnected", closeCode: 1006, reason: "network" })
    source.next({ type: "reconnected" })
    source.next({
      type: "unavailable",
      message: "KIS WebSocket authorization failed",
      retryAfterMs: 300000,
    })

    expect(events).toEqual([
      { type: "subscribed", symbol: "005930" },
      { type: "market", session: "REGULAR_MARKET" },
      {
        type: "trade",
        trade: {
          symbol: "005930",
          price: 78000,
          executedAt: "2026-05-15T10:30:15+09:00",
        },
      },
      { type: "disconnected", closeCode: 1006, reason: "network" },
      { type: "reconnected", symbols: ["005930"] },
      {
        type: "unavailable",
        code: "FEED_UNAVAILABLE",
        message: REALTIME_ERRORS.FEED_UNAVAILABLE.message,
        retryAfterMs: 300000,
      },
    ])

    watcher.unsubscribe()
  })

  it("휴장일에는 외부 체결을 구독하지 않는다", async () => {
    vi.setSystemTime(new Date("2026-08-22T10:00:00+09:00"))
    marketDay.mockResolvedValue(
      ok({
        date: "2026-08-22",
        isBusinessDay: false,
        isTradingDay: false,
        isOpenDay: false,
        isSettlementDay: false,
      })
    )
    const events: RealtimeEvent[] = []
    const watcher = createService()
      .watch(["005930"])
      .subscribe((event) => events.push(event))

    await vi.advanceTimersByTimeAsync(0)

    expect(events.at(-1)).toEqual({ type: "market", session: "CLOSED" })
    expect(tradeStream).not.toHaveBeenCalled()
    watcher.unsubscribe()
  })

  it("거래 여부를 확인할 수 없으면 외부 실패 원인을 구분해 전달한다", async () => {
    const providerData = {
      provider: "kis" as const,
      endpoint: "/uapi/domestic-stock/v1/quotations/chk-holiday",
      upstreamStatus: null,
      upstreamCode: null,
    }
    const failures = [
      {
        error: externalErrors.providerUnavailable(providerData),
        code: "MARKET_SESSION_UNAVAILABLE" as const,
      },
      {
        error: externalErrors.providerAuthUnavailable(providerData),
        code: "MARKET_SESSION_AUTH_UNAVAILABLE" as const,
      },
      {
        error: externalErrors.providerTimeout(providerData),
        code: "MARKET_SESSION_TIMEOUT" as const,
      },
      {
        error: externalErrors.providerInvalidResponse(providerData),
        code: "MARKET_SESSION_INVALID_RESPONSE" as const,
      },
      {
        error: externalErrors.dataNotFound(providerData),
        code: "MARKET_SESSION_NOT_FOUND" as const,
      },
    ]

    for (const { error, code } of failures) {
      marketDay.mockResolvedValueOnce(err(error))
      const events: RealtimeEvent[] = []
      createService()
        .watch(["005930"])
        .subscribe((event) => events.push(event))

      await vi.advanceTimersByTimeAsync(0)

      expect(events).toEqual([
        { type: "subscribed", symbol: "005930" },
        {
          type: "unavailable",
          code,
          message: REALTIME_ERRORS[code].message,
          retryAfterMs: 0,
        },
      ])
    }

    expect(tradeStream).not.toHaveBeenCalled()
  })

  function createService(): RealtimeService {
    return new RealtimeService({
      marketDay,
      tradeStream,
    } as unknown as ExternalService)
  }
})
