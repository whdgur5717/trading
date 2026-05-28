import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import type { NextFunction, Request, Response } from "express"
import { configureApp } from "../src/bootstrap/app-bootstrap"
import { configureSwagger } from "../src/bootstrap/swagger"
import { env } from "../test/env"
import { server } from "../test/support/kis/http"
import { Server as MockKisWebSocketServer } from "../test/support/kis/websocket"

async function bootstrap() {
  const websocket = new MockKisWebSocketServer()
  await websocket.listen()

  const host = process.env.HOST || env.HOST
  const port = process.env.PORT || env.PORT

  Object.assign(process.env, env, {
    HOST: host,
    PORT: port,
    KIS_WS_URL: websocket.url,
  })

  server.listen({ onUnhandledRequest: "bypass" })
  server.events.on("request:start", ({ request }) => {
    console.log(`[MSW] ${request.method} ${request.url}`)
  })
  server.events.on("request:match", ({ request }) => {
    console.log(`[MSW] matched ${request.method} ${request.url}`)
  })

  const { AppModule } = await import("../src/app.module.js")
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)

  configureApp(app)
  configureSwagger(app)
  app.use((request: Request, _response: Response, next: NextFunction) => {
    console.log(`[HTTP] ${request.method} ${request.originalUrl}`)
    next()
  })

  const resolvedPort = config.getOrThrow<number>("PORT")
  const resolvedHost = config.getOrThrow<string>("HOST")

  await app.listen(resolvedPort, resolvedHost)

  console.log(
    `Mock backend listening at http://${resolvedHost}:${resolvedPort}`
  )
  console.log(`KIS REST is mocked by MSW for ${env.KIS_REST_BASE_URL}`)
  console.log(`KIS WebSocket mock listening at ${websocket.url}`)

  const shutdown = async () => {
    await app.close()
    websocket.close()
    server.close()
    process.exit(0)
  }

  process.on("SIGINT", () => {
    shutdown().catch((error: unknown) => {
      console.error(error)
      process.exit(1)
    })
  })
  process.on("SIGTERM", () => {
    shutdown().catch((error: unknown) => {
      console.error(error)
      process.exit(1)
    })
  })
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
