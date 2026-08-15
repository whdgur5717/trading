import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { configureApp } from "../../src/bootstrap/app-bootstrap"
import { MockModule } from "../../src/mock/mock.module"
import { MockRuntime } from "../../src/mock/mock.runtime"

describe("Mock 앱의 API 응답 override", () => {
  let app: NestExpressApplication | undefined
  let appUrl = ""

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(MockModule, {
      logger: false,
    })
    configureApp(app)
    await app.listen(0, "127.0.0.1")
    appUrl = await app.getUrl()
  })

  afterAll(async () => {
    await app?.close()
  })

  afterEach(() => {
    app?.get(MockRuntime).reset()
  })

  it("HTTP override를 저장하면 대상 API에 적용되고 삭제하면 원래 응답으로 돌아간다", async () => {
    const override = {
      operationId: "getPrices",
      method: "GET",
      path: "/prices",
      responseId: "418:0",
      enabled: true,
      status: 418,
      contentType: "application/json",
      body: { scenario: "extreme-price" },
    }

    const saved = await fetch(new URL("/__mock/overrides", appUrl), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(override),
    })
    expect(saved.status).toBe(200)

    const mocked = await fetch(new URL("/prices?symbol=005930", appUrl))
    expect(mocked.status).toBe(418)
    expect(await mocked.json()).toEqual(override.body)

    const listed = await fetch(new URL("/__mock/overrides", appUrl))
    expect(await listed.json()).toEqual({ overrides: [override] })

    const deleted = await fetch(
      new URL("/__mock/overrides?operationId=getPrices", appUrl),
      { method: "DELETE" }
    )
    expect(deleted.status).toBe(200)

    const passthrough = await fetch(new URL("/prices?symbol=005930", appUrl))
    expect(passthrough.status).toBe(200)
    expect(await passthrough.json()).toMatchObject({
      success: true,
      data: { symbol: "005930" },
    })
  })

  it("SSE override를 저장하면 대상 API가 지정한 이벤트를 반환한다", async () => {
    const saved = await fetch(new URL("/__mock/overrides", appUrl), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operationId: "streamRealtimePrices",
        method: "GET",
        path: "/realtime/stream",
        responseId: "200:0",
        enabled: true,
        status: 200,
        contentType: "text/event-stream",
        body: {
          events: [
            {
              event: "price",
              data: { symbol: "005930", price: 999999 },
              close: true,
            },
          ],
        },
      }),
    })
    expect(saved.status).toBe(200)

    const stream = await fetch(
      new URL("/realtime/stream?symbols=005930", appUrl)
    )

    expect(stream.headers.get("content-type")).toContain("text/event-stream")
    expect(await stream.text()).toContain(
      'event: price\ndata: {"symbol":"005930","price":999999}'
    )
  })
})
