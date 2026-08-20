import { lastValueFrom, of, toArray } from "rxjs"
import { describe, expect, it } from "vitest"
import type { RealtimeEvent } from "../event"
import { toServerSentEvents } from "./sse"

describe("toServerSentEvents", () => {
  it("제공처와 무관한 실시간 이벤트를 SSE 계약으로 변환한다", async () => {
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
      {
        type: "disconnected",
        provider: "kis",
        closeCode: 1006,
        reason: "network",
      },
      {
        type: "unavailable",
        provider: "kis",
        message: "upstream timeout",
        retryAfterMs: 300000,
      },
    ]
    const source = of(...sourceEvents)

    const events = await lastValueFrom(
      toServerSentEvents(source).pipe(toArray())
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
      {
        type: "disconnected",
        data: {
          provider: "kis",
          closeCode: 1006,
          reason: "network",
        },
      },
      {
        type: "error",
        retry: 300000,
        data: {
          code: "FEED_UNAVAILABLE",
          provider: "kis",
          message: "upstream timeout",
          retryAfterMs: 300000,
        },
      },
    ])
  })
})
