import { lastValueFrom, of, toArray } from "rxjs"
import { describe, expect, it } from "vitest"
import type { RealtimeEvent } from "./event"
import { toServerSentEvents } from "./realtime.sse"

describe("toServerSentEvents", () => {
  it("내부 이벤트를 SSE 계약으로 변환한다", async () => {
    const sourceEvents: RealtimeEvent[] = [
      { type: "subscribed", symbol: "005930" },
      {
        type: "trade",
        trade: {
          symbol: "005930",
          price: 78000,
          executedAt: "2026-05-15T10:30:15+09:00",
        },
      },
      { type: "market", session: "REGULAR_MARKET" },
      { type: "disconnected", closeCode: 1006, reason: "network" },
      { type: "reconnected", symbols: ["005930"] },
      {
        type: "unavailable",
        code: "FEED_UNAVAILABLE",
        message: "upstream timeout",
        retryAfterMs: 300000,
      },
    ]

    const events = await lastValueFrom(
      toServerSentEvents(of(...sourceEvents)).pipe(toArray())
    )

    expect(events).toEqual([
      { type: "subscribed", data: { symbol: "005930" } },
      {
        type: "price",
        data: {
          symbol: "005930",
          price: 78000,
          executedAt: "2026-05-15T10:30:15+09:00",
        },
      },
      { type: "market", data: { session: "REGULAR_MARKET" } },
      {
        type: "disconnected",
        data: { closeCode: 1006, reason: "network" },
      },
      { type: "reconnected", data: { symbols: ["005930"] } },
      {
        type: "realtime-error",
        retry: 300000,
        data: {
          code: "FEED_UNAVAILABLE",
          message: "upstream timeout",
          retryAfterMs: 300000,
        },
      },
    ])
  })
})
