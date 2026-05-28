import type { AddressInfo } from "node:net"
import { createApp } from "../support/app"
import { env } from "../env"
import { server } from "../support/kis/http"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

describe("stocks", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "bypass" })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it("returns the current price from the external market HTTP API", async () => {
    Object.assign(process.env, env)

    const app = await createApp()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/stocks/005930/current`
      )
      const body = await response.json()

      expect(response.status).toBe(200)

      expect(body).toMatchObject({
        success: true,
        data: {
          stock: {
            code: "005930",
          },
          price: {
            currentPrice: 70000,
            openPrice: 69000,
            highPrice: 71000,
            lowPrice: 68000,
            accumulatedVolume: 12345678,
            previousDayChange: 1000,
            previousDayChangeRate: 1.45,
          },
        },
      })
    } finally {
      await app.close()
    }
  })
})
