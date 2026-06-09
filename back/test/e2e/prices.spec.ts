import type { AddressInfo } from "node:net"
import { createApp } from "../support/app"
import { env } from "../env"
import { server } from "../support/kis/http"
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest"

describe("prices", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "bypass" })
  })

  afterEach(() => {
    vi.useRealTimers()
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it("returns the KIS quote through PricesModule", async () => {
    Object.assign(process.env, env)

    const app = await createApp()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/prices/005930/quote`
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        success: true,
        data: {
          stock: {
            code: "005930",
          },
          quotationMarket: "KRX",
          price: {
            currentPrice: 80000,
            openPrice: 79000,
            highPrice: 81000,
            lowPrice: 78000,
            accumulatedVolume: 12345678,
            previousDayChange: 10000,
            previousDayChangeRate: 14.29,
          },
        },
      })
    } finally {
      await app.close()
    }
  })

  it("returns the current price basis through PricesModule", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-06-04T00:00:01.000Z"))
    Object.assign(process.env, env)

    const app = await createApp()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/prices/005930/current`
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        success: true,
        data: {
          price: 80000,
          quotationMarket: "CONSOLIDATED",
        },
      })
      expect(["current-snapshot", "latest-close"]).toContain(
        body.data.basis.type
      )
    } finally {
      await app.close()
    }
  })

  it("returns a daily candle through PricesModule", async () => {
    Object.assign(process.env, env)

    const app = await createApp()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/prices/005930/daily-candle?date=2026-05-17`
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        success: true,
        data: {
          stock: {
            code: "005930",
          },
          requestedDate: "2026-05-17",
          quotationMarket: "KRX",
          isTradingDay: true,
          candle: {
            date: "2026-05-17",
            closePrice: 70000,
          },
        },
      })
    } finally {
      await app.close()
    }
  })
})
