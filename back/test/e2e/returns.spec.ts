import type { AddressInfo } from "node:net"
import { createApp } from "../support/app"
import { env } from "../env"
import { server } from "../support/kis/http"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

describe("returns", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "bypass" })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it("builds the result response through PricesModule", async () => {
    Object.assign(process.env, env)

    const app = await createApp()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/returns?code=005930&buyDate=2026-05-17&quantity=2`
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        success: true,
        data: {
          stock: {
            code: "005930",
          },
          buy: {
            date: "2026-05-17",
            price: 70000,
            quantity: 2,
          },
          current: {
            price: 70000,
            marketCode: "UN",
          },
          result: {
            buyAmount: 140000,
            currentValue: 140000,
            profit: 0,
            profitRate: 0,
          },
        },
      })
      expect(["current-snapshot", "latest-close"]).toContain(
        body.data.current.basis.type
      )
    } finally {
      await app.close()
    }
  })
})
