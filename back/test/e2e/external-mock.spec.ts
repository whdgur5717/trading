import { ConfigModule, ConfigService } from "@nestjs/config"
import { Test } from "@nestjs/testing"
import { once } from "node:events"
import { afterEach, describe, expect, it } from "vitest"
import WebSocket from "ws"
import { validateEnv } from "../../src/config/env.validation"
import {
  FSC_BASE_URL,
  fscRest,
} from "../../src/market/adaptor/fsc/fsc.protocol"
import { rest as kisRest } from "../../src/market/adaptor/kis/protocol"
import {
  OPENDART_BASE_URL,
  opendartRest,
} from "../../src/market/adaptor/opendart/opendart.protocol"
import {
  ExternalMockModule,
  ExternalMockRuntime,
} from "../../src/mock/external/external-mock.module"

describe("외부 mock runtime", () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined

  afterEach(async () => {
    await app?.close()
  })

  it("mock 환경에서는 모든 외부 REST와 WebSocket 연결이 로컬 응답으로 대체된다", async () => {
    app = await createApp()
    await app.init()

    const config = app.get(ConfigService)
    const kisResponse = await fetch(
      `${config.getOrThrow<string>("KIS_REST_BASE_URL")}${kisRest.price.path}`
    )
    const fscResponse = await fetch(`${FSC_BASE_URL}${fscRest.stockPriceInfo}`)
    const opendartResponse = await fetch(
      `${OPENDART_BASE_URL}${opendartRest.company}`
    )

    expect(kisResponse.ok).toBe(true)
    expect(await kisResponse.json()).toMatchObject({
      rt_cd: "0",
      msg_cd: "MCA00000",
    })
    expect(fscResponse.ok).toBe(true)
    expect(await fscResponse.json()).toMatchObject({
      response: { header: { resultCode: "00" } },
    })
    expect(opendartResponse.ok).toBe(true)
    expect(await opendartResponse.json()).toMatchObject({ status: "000" })
    expect(config.getOrThrow<string>("KIS_WS_URL")).toMatch(
      /^ws:\/\/127\.0\.0\.1:\d+$/
    )
  })

  it("테스트 상태를 초기화하면 열려 있던 실시간 연결이 종료된다", async () => {
    app = await createApp()
    await app.init()

    const socket = new WebSocket(
      app.get(ConfigService).getOrThrow<string>("KIS_WS_URL")
    )
    await once(socket, "open")
    const closed = once(socket, "close")

    app.get(ExternalMockRuntime).reset()

    await closed
    expect(socket.readyState).toBe(WebSocket.CLOSED)
  })
})

async function createApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [".env.test"],
        validate: validateEnv,
      }),
      ExternalMockModule,
    ],
  }).compile()

  return moduleRef.createNestApplication()
}
