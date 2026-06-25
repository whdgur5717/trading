import type { NestExpressApplication } from "@nestjs/platform-express"
import { ConfigService } from "@nestjs/config"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import openapi from "../../docs/openapi.json"
import { createApp } from "../support/app"
import { createExternalServer } from "../support/external/server"
import { Server as KisWebSocketServer } from "../support/external/kis/websocket/server"

const jsonContentType = "application/json"
const sseContentType = "text/event-stream"
const methods = new Set(["get", "post", "put", "patch", "delete"])

type OpenApiPaths = typeof openapi.paths
type OpenApiPath = keyof OpenApiPaths
type Operation = {
  [Path in OpenApiPath]: OpenApiPaths[Path][keyof OpenApiPaths[Path]]
}[OpenApiPath]
type OperationParameter<T> = T extends {
  readonly parameters?: readonly (infer Parameter)[]
}
  ? Parameter
  : never
type Parameter = OperationParameter<Operation>
type OperationContentType = typeof jsonContentType | typeof sseContentType

type OpenApiTestMetadata = {
  readonly expect?: {
    readonly body?: unknown
    readonly events?: Array<Record<string, unknown>>
    readonly stopAfterEvents?: number
    readonly timeoutMs?: number
  }
  readonly request?: {
    readonly path?: Record<string, unknown>
    readonly query?: Record<string, unknown>
  }
}

type OperationCase = {
  readonly contentType: OperationContentType
  readonly method: string
  readonly operation: Operation
  readonly path: string
}

let app: NestExpressApplication | undefined
let appUrl: string
let kisWebSocketServer: KisWebSocketServer | undefined
let externalServer: ReturnType<typeof createExternalServer> | undefined

beforeAll(async () => {
  kisWebSocketServer = new KisWebSocketServer()
  await kisWebSocketServer.listen()

  app = await createApp({
    config: {
      KIS_WS_URL: kisWebSocketServer.url,
    },
  })
  const config = app.get(ConfigService)
  externalServer = createExternalServer({
    kisRestBaseUrl: config.getOrThrow<string>("KIS_REST_BASE_URL"),
  })

  await app.listen(0, "127.0.0.1")
  appUrl = await app.getUrl()

  externalServer.listen({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).origin === appUrl) {
        return
      }

      print.error()
    },
  })
}, 30_000)

afterEach(() => {
  externalServer?.resetHandlers()
})

afterAll(async () => {
  await app?.close()
  kisWebSocketServer?.close()
  externalServer?.close()
})

function operationsFromOpenApi(): OperationCase[] {
  const operationCases: OperationCase[] = []

  for (const [path, pathItem] of openApiPaths()) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!methods.has(method)) {
        continue
      }

      const response = operation.responses["200"]

      if (!response || isReferenceObject(response)) {
        continue
      }

      if (response.content?.[jsonContentType]) {
        operationCases.push({
          contentType: jsonContentType,
          method,
          operation,
          path,
        })
        continue
      }

      if (response.content?.[sseContentType]) {
        operationCases.push({
          contentType: sseContentType,
          method,
          operation,
          path,
        })
      }
    }
  }

  return operationCases
}

function openApiPaths(): Array<[OpenApiPath, OpenApiPaths[OpenApiPath]]> {
  return Object.entries(openapi.paths) as Array<
    [OpenApiPath, OpenApiPaths[OpenApiPath]]
  >
}

function testMetadata(operation: Operation): OpenApiTestMetadata {
  const metadata: unknown = Reflect.get(operation, "x-test")

  if (!metadata || typeof metadata !== "object") {
    return {}
  }

  return metadata
}

function parameterValue(parameter: Parameter, operation: Operation): unknown {
  const request = testMetadata(operation).request ?? {}
  const override = request[parameter.in]?.[parameter.name]

  if (override !== undefined) {
    return override
  }

  const parameterExample = propertyValue(parameter, "example")

  if (parameterExample !== undefined) {
    return parameterExample
  }

  const schema = parameter.schema

  if (!schema || isReferenceObject(schema)) {
    throw new Error(`OpenAPI parameter example is missing: ${parameter.name}`)
  }

  const schemaExample = propertyValue(schema, "example")

  if (schemaExample !== undefined) {
    return schemaExample
  }

  const defaultValue = propertyValue(schema, "default")

  if (defaultValue !== undefined) {
    return defaultValue
  }

  const constValue = propertyValue(schema, "const")

  if (constValue !== undefined) {
    return constValue
  }

  throw new Error(`OpenAPI parameter example is missing: ${parameter.name}`)
}

function propertyValue(value: object, property: string): unknown {
  return Object.hasOwn(value, property)
    ? Reflect.get(value, property)
    : undefined
}

function isReferenceObject(value: unknown): value is { readonly $ref: string } {
  return typeof value === "object" && value !== null && "$ref" in value
}

function urlFor(operation: OperationCase): URL {
  const query = new URLSearchParams()
  let requestPath = operation.path

  for (const parameter of operation.operation.parameters ?? []) {
    if (isReferenceObject(parameter)) {
      throw new Error(
        `OpenAPI parameter reference is not supported: ${operation.path}`
      )
    }

    const value = parameterValue(parameter, operation.operation)

    if (parameter.in === "path") {
      requestPath = requestPath.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(value))
      )
    }

    if (parameter.in === "query") {
      query.set(String(parameter.name), String(value))
    }
  }

  const url = new URL(String(requestPath), appUrl)
  url.search = query.toString()

  return url
}

async function runJsonOperation(operation: OperationCase): Promise<void> {
  const response = await fetch(urlFor(operation), {
    method: operation.method.toUpperCase(),
  })
  const body: unknown = await response.json()
  const expectedBody = testMetadata(operation.operation).expect?.body

  expect(response.status).toBe(200)

  if (expectedBody !== undefined) {
    expect(body).toEqual(expectedBody)
    return
  }

  expect(body).toEqual(expect.objectContaining({ success: true }))
}

async function runSseOperation(operation: OperationCase): Promise<void> {
  const controller = new AbortController()
  const metadata = testMetadata(operation.operation)
  const timeoutMs = metadata.expect?.timeoutMs ?? 3_000
  const timeout = setTimeout(() => controller.abort(), Number(timeoutMs))

  try {
    const response = await fetch(urlFor(operation), {
      headers: {
        accept: sseContentType,
      },
      method: operation.method.toUpperCase(),
      signal: controller.signal,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain(sseContentType)

    const expectedEvents = metadata.expect?.events
    const eventCount = Number(
      metadata.expect?.stopAfterEvents ?? expectedEvents?.length ?? 1
    )
    const events = await readSseEvents(response, eventCount)

    if (expectedEvents !== undefined) {
      expect(events).toEqual(expectedEvents)
      return
    }

    expect(events).toHaveLength(eventCount)
    expect(events[0]).toEqual(
      expect.objectContaining({
        data: expect.anything(),
        event: expect.any(String),
      })
    )
  } finally {
    clearTimeout(timeout)
    controller.abort()
  }
}

async function readSseEvents(
  response: Response,
  count: number
): Promise<Array<Record<string, unknown>>> {
  if (!response.body) {
    throw new Error("SSE response body is missing")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const events: Array<Record<string, unknown>> = []
  let buffer = ""

  try {
    while (events.length < count) {
      const chunk = await reader.read()

      if (chunk.done) {
        break
      }

      buffer += decoder.decode(chunk.value, { stream: true })

      while (events.length < count) {
        const frame = takeSseFrame(buffer)

        if (!frame) {
          break
        }

        buffer = frame.rest
        events.push(parseSseFrame(frame.value))
      }
    }
  } finally {
    await reader.cancel()
  }

  return events
}

function takeSseFrame(
  buffer: string
): { readonly rest: string; readonly value: string } | null {
  const index = buffer.indexOf("\n\n")

  if (index < 0) {
    return null
  }

  return {
    rest: buffer.slice(index + 2),
    value: buffer.slice(0, index),
  }
}

function parseSseFrame(frame: string): Record<string, unknown> {
  const event: Record<string, unknown> = {}
  const data: string[] = []

  for (const line of frame.split("\n")) {
    const separator = line.indexOf(":")

    if (separator < 0) {
      continue
    }

    const field = line.slice(0, separator)
    const value = line.slice(separator + 1).trimStart()

    if (field === "event") {
      event.event = value
    }

    if (field === "data") {
      data.push(value)
    }
  }

  return {
    ...event,
    data: parseSseData(data.join("\n")),
  }
}

function parseSseData(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

describe("OpenAPI API requests", () => {
  for (const operation of operationsFromOpenApi()) {
    it(`${operation.method.toUpperCase()} ${operation.path}`, async () => {
      if (operation.contentType === jsonContentType) {
        await runJsonOperation(operation)
        return
      }

      await runSseOperation(operation)
    })
  }
})
