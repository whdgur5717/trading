import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { configureApp } from "../../src/bootstrap/app-bootstrap"
import { MockModule } from "../../src/mock/mock.module"

let app: NestExpressApplication
let appUrl: string

beforeAll(async () => {
  app = await NestFactory.create<NestExpressApplication>(MockModule, {
    logger: false,
  })
  configureApp(app)

  await app.listen(0, "127.0.0.1")
  appUrl = await app.getUrl()
}, 30_000)

afterAll(async () => {
  await app?.close()
})

describe("HTTP 오류 처리", () => {
  it("일반 API의 예상된 실패를 공개 오류 계약으로 반환한다", async () => {
    const response = await fetch(new URL("/prices?symbol=000000", appUrl))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      success: false,
      error: {
        type: "stock.unsupported",
        status: 404,
        message: "Unsupported stock symbol",
        data: { symbol: "000000" },
      },
    })
  })

  it("SSE 연결 전에 발견한 잘못된 요청을 HTTP 오류로 반환한다", async () => {
    const response = await fetch(
      new URL("/realtime/stream?symbols=5930", appUrl)
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          type: "common.invalid_request",
          status: 400,
        }),
      })
    )
  })

  it("Nest가 생성한 경로 오류의 상태를 그대로 유지한다", async () => {
    const response = await fetch(new URL("/missing", appUrl))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual(
      expect.objectContaining({
        statusCode: 404,
      })
    )
  })

  it("상태 확인 응답은 감싸지 않고 요청 식별자를 함께 반환한다", async () => {
    const response = await fetch(new URL("/health", appUrl))

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
    expect(await response.json()).toEqual({ status: "ok" })
  })
})
