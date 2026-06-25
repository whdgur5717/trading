import { z } from "zod"

export const runtime = "nodejs"

const overrideSchema = z.object({
  operationId: z.string().min(1),
  responseId: z.string().min(1),
  enabled: z.boolean(),
  body: z.unknown(),
  delayMs: z.number().int().nonnegative().optional(),
})

function badRequest(message: string) {
  return Response.json({ message }, { status: 400 })
}

function notFound() {
  return Response.json({ message: "Not found" }, { status: 404 })
}

function mockBackendUrl(path: string): URL | null {
  return process.env.API_BASE_URL
    ? new URL(path, process.env.API_BASE_URL)
    : null
}

function unavailable() {
  return Response.json(
    { message: "Mock backend is unavailable" },
    { status: 503 }
  )
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return notFound()
  }

  const [
    { readMockOperations },
    { getMockOperation, getMockResponseTemplate },
  ] = await Promise.all([
    import("@/mocks/runtime/openapi"),
    import("@/mocks/runtime/catalog"),
  ])
  const operations = await readMockOperations()

  const parsed = overrideSchema.safeParse(await request.json())

  if (!parsed.success) {
    return badRequest("Invalid mock override payload")
  }

  const operation = getMockOperation(parsed.data.operationId, operations)

  if (!operation) {
    return badRequest("Unknown operationId")
  }

  const template = getMockResponseTemplate(operation, parsed.data.responseId)

  if (!template) {
    return badRequest("Unsupported response for operation")
  }

  const url = mockBackendUrl("/__mock/overrides")

  if (!url) {
    return unavailable()
  }

  const override = {
    ...parsed.data,
    method: operation.method,
    path: operation.path,
    status: template.status,
    contentType: template.contentType,
  }
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(override),
    cache: "no-store",
  })

  if (!response.ok) {
    return unavailable()
  }

  return Response.json({
    operationId: parsed.data.operationId,
    override,
  })
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return notFound()
  }

  const operationId = new URL(request.url).searchParams.get("operationId")

  if (!operationId) {
    return badRequest("operationId is required")
  }

  const url = mockBackendUrl(
    `/__mock/overrides?operationId=${encodeURIComponent(operationId)}`
  )

  if (!url) {
    return unavailable()
  }

  const response = await fetch(url, {
    method: "DELETE",
    cache: "no-store",
  })

  if (!response.ok) {
    return unavailable()
  }

  return Response.json({ operationId, override: null })
}
