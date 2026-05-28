import type { AddressInfo } from "node:net"
import { createApp } from "../support/app"
import { env } from "../env"
import { server } from "../support/kis/http"
import { Server } from "../support/kis/websocket"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

describe("realtime", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "bypass" })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it("subscribes through the external market websocket and streams prices", async () => {
    const websocket = new Server()
    await websocket.listen()

    Object.assign(process.env, env, {
      KIS_WS_URL: websocket.url,
    })

    const app = await createApp()
    const abortController = new AbortController()

    try {
      await app.listen(0, "127.0.0.1")

      const address = app.getHttpServer().address() as AddressInfo
      const response = await fetch(
        `http://127.0.0.1:${address.port}/realtime/stream?stockCodes=005930`,
        {
          signal: abortController.signal,
        }
      )

      const subscription = JSON.parse(await websocket.receive())

      expect(subscription).toMatchObject({
        header: {
          approval_key: "testApprovalKey",
          tr_type: "1",
        },
        body: {
          input: {
            tr_id: "H0STCNT0",
            tr_key: "005930",
          },
        },
      })

      const reader = (response.body as ReadableStream<Uint8Array>).getReader()
      const decoder = new TextDecoder()
      let stream = ""

      while ((stream.match(/event: price/g) ?? []).length < 2) {
        const result = await reader.read()

        if (result.done) {
          break
        }

        stream += decoder.decode(result.value, { stream: true })
      }

      expect(response.status).toBe(200)
      expect(stream).toContain("event: subscribed")
      expect(stream).toContain("event: price")
      expect(stream).toContain('"stockCode":"005930"')
      expect(stream).toContain('"price":70000')
    } finally {
      abortController.abort()
      websocket.close()
      await app.close()
    }
  })
})
