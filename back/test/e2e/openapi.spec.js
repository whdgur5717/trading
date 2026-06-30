import { ConfigService } from "@nestjs/config"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { createSwaggerDocument } from "../../src/bootstrap/swagger"
import { createApp } from "../support/app"
import { createExternalServer } from "../support/external/server"
import { Server as KisWebSocketServer } from "../support/external/kis/websocket/server"
import {
  jsonContentType,
  openApiRequestCases,
  sseContentType,
} from "../support/openapi/openApiRequestCases"

const openapi = await createOpenApiDocument()
const requestCases = openApiRequestCases(openapi)

let app
let appUrl
let kisWebSocketServer
let externalServer

async function createOpenApiDocument() {
  const documentApp = await createApp()

  try {
    return createSwaggerDocument(documentApp)
  } finally {
    await documentApp.close()
  }
}

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
    kisRestBaseUrl: config.getOrThrow("KIS_REST_BASE_URL"),
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
