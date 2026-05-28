import { RealtimeSubscriptionRegistry } from "./realtime-subscription-registry"
import { describe, expect, it } from "vitest"

describe("RealtimeSubscriptionRegistry", () => {
  it("tracks client counts per stock code and reports first/last subscriptions", () => {
    const registry = new RealtimeSubscriptionRegistry()

    expect(registry.addClient("client-a", ["005930", "005930"])).toEqual({
      activatedStockCodes: ["005930"],
      subscribedStockCodes: ["005930"],
    })
    expect(registry.addClient("client-b", ["005930", "000660"])).toEqual({
      activatedStockCodes: ["000660"],
      subscribedStockCodes: ["000660", "005930"],
    })
    expect(registry.getActiveStockCodes()).toEqual(["000660", "005930"])
    expect(registry.removeClient("client-a")).toEqual({
      deactivatedStockCodes: [],
    })
    expect(registry.getActiveStockCodes()).toEqual(["000660", "005930"])
    expect(registry.removeClient("client-b")).toEqual({
      deactivatedStockCodes: ["000660", "005930"],
    })
    expect(registry.getActiveStockCodes()).toEqual([])
  })
})
