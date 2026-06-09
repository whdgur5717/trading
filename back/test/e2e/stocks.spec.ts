import type { AddressInfo } from "node:net"
import { createApp } from "../support/app"
import { env } from "../env"
import { describe, expect, it } from "vitest"

describe("stocks", () => {
  it("returns stock master data by code", async () => {
    Object.assign(process.env, env)

    const app = await createApp()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/stocks/005930`
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        success: true,
        data: {
          code: "005930",
          name: "삼성전자",
          marketName: "KOSPI",
          quotationMarket: "KRX",
        },
      })
    } finally {
      await app.close()
    }
  })
})
