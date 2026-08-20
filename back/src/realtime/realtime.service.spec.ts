import { Subject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import type { RealtimeBroker } from "./broker/realtime-broker.contract"
import type { RealtimeEvent } from "./event"
import { RealtimeService } from "./realtime.service"

describe("RealtimeService", () => {
  it("Broker가 제공한 실시간 이벤트를 전달한다", () => {
    const brokerEvents = new Subject<RealtimeEvent>()
    const watch = vi.fn(() => brokerEvents)
    const broker = {
      watch,
    } as unknown as RealtimeBroker
    const service = new RealtimeService(broker)
    const events: RealtimeEvent[] = []
    const watcher = service.watch(["005930"]).subscribe((event) => {
      events.push(event)
    })

    const event: RealtimeEvent = {
      type: "subscribed",
      symbol: "005930",
    }
    brokerEvents.next(event)

    expect(watch).toHaveBeenCalledOnce()
    expect(watch).toHaveBeenCalledWith(["005930"])
    expect(events).toEqual([event])

    watcher.unsubscribe()
  })
})
