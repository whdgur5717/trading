import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import type { NextFunction, Request, Response } from "express"
import { AppCoreModule } from "../src/app-core.module"
import { configureApp } from "../src/bootstrap/app-bootstrap"
import { configureSwagger } from "../src/bootstrap/swagger"
import { validateEnv } from "../src/config/env.validation"
import { createExternalServer } from "../test/support/external/server"
import { Server as MockKisWebSocketServer } from "../test/support/external/kis/websocket/server"
import { z } from "zod"

const mockOverrideSchema = z.object({
  operationId: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().min(1),
  responseId: z.string().min(1),
  enabled: z.boolean(),
  status: z.number().int(),
  contentType: z.enum(["application/json", "text/event-stream"]),
  body: z.unknown(),
  delayMs: z.number().int().nonnegative().optional(),
})

type MockOverride = z.infer<typeof mockOverrideSchema>

const sseEventSchema = z.object({
  event: z
    .string()
    .min(1)
    .regex(/^[^\r\n]+$/),
  data: z.unknown(),
  id: z.string().min(1).optional(),
  retry: z.number().int().positive().optional(),
  delayMs: z.number().int().nonnegative().optional(),
  repeatMs: z.number().int().positive().optional(),
  close: z.boolean().optional(),
})

const sseScenarioSchema = z.object({
  events: z.array(sseEventSchema).min(1),
})

const mockOverrides = new Map<string, MockOverride>()

function pathMatches(operationPath: string, requestPath: string): boolean {
  const operationSegments = operationPath.split("/").filter(Boolean)
  const requestSegments = requestPath.split("/").filter(Boolean)

  return (
    operationSegments.length === requestSegments.length &&
    operationSegments.every(
      (segment, index) =>
        (segment.startsWith("{") && segment.endsWith("}")) ||
        segment === requestSegments[index]
    )
  )
}

function matchingOverride(request: Request): MockOverride | undefined {
  return Array.from(mockOverrides.values()).find(
    (override) =>
      override.enabled &&
      override.method === request.method &&
      pathMatches(override.path, request.path)
  )
}

function readBody(request: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    request.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"))
    })
    request.on("error", reject)
  })
}

async function readJson(request: Request): Promise<unknown> {
  const body = await readBody(request)

  if (!body) {
    return null
  }

  try {
    return JSON.parse(body)
  } catch {
    return undefined
  }
}

function writeJson(response: Response, status: number, body: unknown): void {
  response.status(status).json(body)
}

function writeSse(response: Response, event: z.infer<typeof sseEventSchema>) {
  if (event.id) {
    response.write(`id: ${event.id}\n`)
  }

  if (event.retry) {
    response.write(`retry: ${event.retry}\n`)
  }

  response.write(`event: ${event.event}\n`)
  response.write(`data: ${JSON.stringify(event.data)}\n\n`)

  if (event.close) {
    response.end()
  }
}

function writeEventStream(
  request: Request,
  response: Response,
  override: MockOverride
): void {
  const scenario = sseScenarioSchema.safeParse(override.body)

  response.status(override.status)
  response.setHeader("content-type", "text/event-stream; charset=utf-8")
  response.setHeader("cache-control", "no-cache, no-transform")
  response.setHeader("connection", "keep-alive")
  response.flushHeaders()

  if (!scenario.success) {
    writeSse(response, {
      event: "error",
      data: {
        code: "INVALID_MOCK_STREAM",
        message: "Mock event-stream body must be { events: [...] }",
      },
      close: true,
    })
    return
  }

  const timers = new Set<ReturnType<typeof setTimeout>>()
  const cleanup = () => {
    for (const timer of timers) {
      clearTimeout(timer)
    }
    timers.clear()
  }

  request.on("close", cleanup)
  response.on("close", cleanup)

  for (const event of scenario.data.events) {
    const send = () => {
      if (!response.writableEnded) {
        writeSse(response, event)
      }
    }
    const delayMs = event.delayMs ?? 0

    if (event.repeatMs) {
      const startTimer = setTimeout(() => {
        send()
        const interval = setInterval(send, event.repeatMs)
        timers.add(interval)
      }, delayMs)

      timers.add(startTimer)
      continue
    }

    const timer = setTimeout(send, delayMs)
    timers.add(timer)
  }
}

async function handleMockRequest(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  if (request.path === "/__mock/overrides" && request.method === "GET") {
    writeJson(response, 200, { overrides: Array.from(mockOverrides.values()) })
    return
  }

  if (request.path === "/__mock/overrides" && request.method === "PUT") {
    const parsed = mockOverrideSchema.safeParse(await readJson(request))

    if (!parsed.success) {
      writeJson(response, 400, { message: "Invalid mock override payload" })
      return
    }

    mockOverrides.set(parsed.data.operationId, parsed.data)
    writeJson(response, 200, {
      operationId: parsed.data.operationId,
      override: parsed.data,
    })
    return
  }

  if (request.path === "/__mock/overrides" && request.method === "DELETE") {
    const operationId =
      typeof request.query.operationId === "string"
        ? request.query.operationId
        : ""

    if (!operationId) {
      writeJson(response, 400, { message: "operationId is required" })
      return
    }

    mockOverrides.delete(operationId)
    writeJson(response, 200, { operationId, override: null })
    return
  }

  if (request.path.startsWith("/__mock/")) {
    writeJson(response, 404, { message: "Not found" })
    return
  }

  const override = matchingOverride(request)

  if (!override) {
    next()
    return
  }

  if (override.delayMs && override.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, override.delayMs))
  }

  if (override.contentType === "application/json") {
    response.status(override.status).json(override.body)
    return
  }

  writeEventStream(request, response, override)
}

function installMockMiddleware(app: NestExpressApplication): void {
  app.use((request: Request, response: Response, next: NextFunction) => {
    handleMockRequest(request, response, next).catch(next)
  })
}

async function bootstrap() {
  const websocket = new MockKisWebSocketServer()
  await websocket.listen()

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [`.env.${process.env.NODE_ENV}`],
        load: [() => ({ KIS_WS_URL: websocket.url })],
        validate: validateEnv,
      }),
      AppCoreModule,
    ],
  })
  class MockAppModule {}

  const app = await NestFactory.create<NestExpressApplication>(MockAppModule)
  const config = app.get(ConfigService)
  const server = createExternalServer({
    kisRestBaseUrl: config.getOrThrow<string>("KIS_REST_BASE_URL"),
  })

  installMockMiddleware(app)
  configureApp(app)
  configureSwagger(app)
  app.use((request: Request, _response: Response, next: NextFunction) => {
    console.log(`[HTTP] ${request.method} ${request.originalUrl}`)
    next()
  })

  const resolvedPort = config.getOrThrow<number>("PORT")
  const resolvedHost = config.getOrThrow<string>("HOST")

  await app.listen(resolvedPort, resolvedHost)

  server.listen({
    onUnhandledRequest:
      process.env.MSW_ON_UNHANDLED_REQUEST === "bypass" ? "bypass" : "error",
  })
  server.events.on("request:start", ({ request }) => {
    console.log(`[MSW] ${request.method} ${request.url}`)
  })
  server.events.on("request:match", ({ request }) => {
    console.log(`[MSW] matched ${request.method} ${request.url}`)
  })

  console.log(
    `Mock backend listening at http://${resolvedHost}:${resolvedPort}`
  )
  console.log(
    `KIS REST is mocked by MSW for ${config.getOrThrow<string>("KIS_REST_BASE_URL")}`
  )
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
