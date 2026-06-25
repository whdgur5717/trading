import { z } from "zod"

import type { MockOperationState } from "@/mocks/runtime/types"

import { responseBodyText } from "./model"

export type MockTestResult = {
  status: number
  body: string
}

const responseTemplateSchema = z.object({
  responseId: z.string(),
  status: z.number().int(),
  label: z.string(),
  contentType: z.enum(["application/json", "text/event-stream"]),
  body: z.unknown(),
})

const overrideSchema = z
  .object({
    enabled: z.boolean(),
    responseId: z.string(),
    status: z.number().int(),
    body: z.unknown(),
    delayMs: z.number().int().nonnegative().optional(),
  })
  .nullable()

const operationSchema = z.object({
  operationId: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  request: z.object({
    path: z.string(),
    query: z.record(z.string(), z.unknown()),
  }),
  responses: z.array(responseTemplateSchema),
  override: overrideSchema,
})

const operationsSchema = z.object({
  operations: z.array(operationSchema),
})

async function responseText(response: Response): Promise<string> {
  const text = await response.text()

  return text || response.statusText
}

async function eventStreamPreview(response: Response): Promise<string> {
  const reader = response.body?.getReader()

  if (!reader) {
    return response.statusText
  }

  const decoder = new TextDecoder()
  let text = ""

  for (let index = 0; index < 4; index += 1) {
    const result = await Promise.race([
      reader.read(),
      new Promise<"timeout">((resolve) => {
        setTimeout(() => resolve("timeout"), 1_500)
      }),
    ])

    if (result === "timeout" || result.done) {
      break
    }

    text += decoder.decode(result.value, { stream: true })

    if (text.split("\n\n").length > 3) {
      break
    }
  }

  await reader.cancel()

  return text.trimEnd()
}

export async function readMockOperations(): Promise<MockOperationState[]> {
  const response = await fetch("/api/mock/operations", {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await responseText(response))
  }

  return operationsSchema.parse(await response.json()).operations
}

export async function saveMockOverride(input: {
  operationId: string
  responseId: string
  body: unknown
}): Promise<void> {
  const response = await fetch("/api/mock/overrides", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      operationId: input.operationId,
      enabled: true,
      responseId: input.responseId,
      body: input.body,
    }),
  })

  if (!response.ok) {
    throw new Error(await responseText(response))
  }
}

export async function clearMockOperation(operationId: string): Promise<void> {
  const response = await fetch(
    `/api/mock/overrides?operationId=${encodeURIComponent(operationId)}`,
    { method: "DELETE" }
  )

  if (!response.ok) {
    throw new Error(await responseText(response))
  }
}

export async function requestPreview(url: string): Promise<MockTestResult> {
  const response = await fetch(url, {
    cache: "no-store",
  })
  const contentType = response.headers.get("content-type")
  const text = contentType?.includes("text/event-stream")
    ? await eventStreamPreview(response)
    : await response.text()
  const body: unknown =
    text && contentType?.includes("application/json") ? JSON.parse(text) : text

  return {
    status: response.status,
    body: responseBodyText(body),
  }
}
