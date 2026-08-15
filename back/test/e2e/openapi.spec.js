import { readFile } from "node:fs/promises"
import { NestFactory } from "@nestjs/core"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { configureApp } from "../../src/bootstrap/app-bootstrap"
import { MockModule } from "../../src/mock/mock.module"
import { MockRuntime } from "../../src/mock/mock.runtime"

const jsonContentType = "application/json"
const sseContentType = "text/event-stream"
const methods = ["get", "post", "put", "patch", "delete"]
const responseContentTypes = [jsonContentType, sseContentType]
const openApiUrl = new URL(
  "../../../packages/api-client/openapi.json",
  import.meta.url
)

const openapi = JSON.parse(await readFile(openApiUrl, "utf8"))
const requestCases = openApiRequestCases(openapi)

let app
let appUrl

beforeAll(async () => {
  app = await NestFactory.create(MockModule, { logger: false })
  configureApp(app)

  await app.listen(0, "127.0.0.1")
  appUrl = await app.getUrl()
}, 30_000)

afterEach(() => {
  app?.get(MockRuntime).reset()
})

afterAll(async () => {
  await app?.close()
})

function openApiRequestCases(document) {
  return Object.entries(document.paths).flatMap(([path, pathItem]) =>
    methods.flatMap((method) => {
      if (path === "/health") {
        return []
      }

      const operation = pathItem[method]

      if (!operation) {
        return []
      }

      const response = operation.responses["200"]

      if (!response || "$ref" in response) {
        return []
      }

      const contentType = responseContentTypes.find(
        (candidate) => response.content?.[candidate]
      )

      if (!contentType) {
        return []
      }

      const extension = operation["x-test"]
      const metadata =
        extension && typeof extension === "object" ? extension : {}
      const target = requestTarget(path, operation.parameters ?? [], metadata)

      return [
        {
          contentType,
          expected: metadata.expect ?? {},
          method: method.toUpperCase(),
          name: `${method.toUpperCase()} ${path}`,
          path: target.path,
          query: target.query,
        },
      ]
    })
  )
}

function requestTarget(path, parameters, metadata) {
  const query = new URLSearchParams()
  let resolvedPath = path

  for (const parameter of parameters) {
    if ("$ref" in parameter) {
      throw new Error(`OpenAPI parameter reference is not supported: ${path}`)
    }

    const value = exampleValue(parameter, metadata.request ?? {})

    if (parameter.in === "path") {
      resolvedPath = resolvedPath.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(value))
      )
      continue
    }

    if (parameter.in === "query") {
      query.set(parameter.name, String(value))
    }
  }

  return {
    path: resolvedPath,
    query: query.toString(),
  }
}

function exampleValue(parameter, requestOverride) {
  const schema = parameter.schema
  const candidates = [
    requestOverride[parameter.in]?.[parameter.name],
    parameter.example,
    schema && !("$ref" in schema) ? schema.example : undefined,
    schema && !("$ref" in schema) ? schema.default : undefined,
    schema && !("$ref" in schema) ? schema.const : undefined,
  ]
  const value = candidates.find((candidate) => candidate !== undefined)

  if (value === undefined) {
    throw new Error(`OpenAPI parameter example is missing: ${parameter.name}`)
  }

  return value
}

function urlFor(requestCase) {
  const url = new URL(requestCase.path, appUrl)
  url.search = requestCase.query

  return url
}

async function fetchJsonRequest(requestCase) {
  const response = await fetch(urlFor(requestCase), {
    method: requestCase.method,
  })
  const body = await response.json()

  return { body, response }
}

async function fetchSseRequest(requestCase) {
  const controller = new AbortController()
  const timeoutMs = requestCase.expected.timeoutMs ?? 3_000
  const timeout = setTimeout(() => controller.abort(), Number(timeoutMs))

  try {
    const response = await fetch(urlFor(requestCase), {
      headers: {
        accept: sseContentType,
      },
      method: requestCase.method,
      signal: controller.signal,
    })

    const expectedEvents = requestCase.expected.events
    const eventCount = Number(
      requestCase.expected.stopAfterEvents ?? expectedEvents?.length ?? 1
    )
    const events = await readSseEvents(response, eventCount)

    return { eventCount, events, response }
  } finally {
    clearTimeout(timeout)
    controller.abort()
  }
}

async function readSseEvents(response, count) {
  if (!response.body) {
    throw new Error("SSE response body is missing")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const events = []
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

function takeSseFrame(buffer) {
  const index = buffer.indexOf("\n\n")

  if (index < 0) {
    return null
  }

  return {
    rest: buffer.slice(index + 2),
    value: buffer.slice(0, index),
  }
}

function parseSseFrame(frame) {
  const event = {}
  const data = []

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

function parseSseData(value) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

describe("OpenAPI API requests", () => {
  for (const requestCase of requestCases) {
    it(requestCase.name, async () => {
      if (requestCase.contentType === jsonContentType) {
        const { body, response } = await fetchJsonRequest(requestCase)

        expect(response.status, requestCase.name).toBe(200)

        if (requestCase.expected.body !== undefined) {
          expect(body).toEqual(requestCase.expected.body)
          return
        }

        expect(body).toEqual(expect.objectContaining({ success: true }))
        return
      }

      const { eventCount, events, response } =
        await fetchSseRequest(requestCase)

      expect(response.status, requestCase.name).toBe(200)
      expect(response.headers.get("content-type")).toContain(sseContentType)

      if (requestCase.expected.events !== undefined) {
        expect(events).toEqual(requestCase.expected.events)
        return
      }

      expect(events).toHaveLength(eventCount)
      expect(events[0]).toEqual(
        expect.objectContaining({
          data: expect.anything(),
          event: expect.any(String),
        })
      )
    })
  }
})
