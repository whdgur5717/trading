import type { MockOverride } from "@/mocks/runtime/types"

export const runtime = "nodejs"

function notFound() {
  return Response.json({ message: "Not found" }, { status: 404 })
}

type BackendMockOverride = MockOverride & {
  operationId: string
}

async function readBackendOverrides(): Promise<Map<string, MockOverride>> {
  const apiBaseUrl = process.env.API_BASE_URL

  if (!apiBaseUrl) {
    return new Map()
  }

  try {
    const response = await fetch(new URL("/__mock/overrides", apiBaseUrl), {
      cache: "no-store",
    })

    if (!response.ok) {
      return new Map()
    }

    const body = (await response.json()) as {
      overrides: BackendMockOverride[]
    }

    return new Map(
      body.overrides.map(({ operationId, ...override }) => [
        operationId,
        override,
      ])
    )
  } catch {
    return new Map()
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return notFound()
  }

  const [{ readMockOperations }, { getMockOperationStates }] =
    await Promise.all([
      import("@/mocks/runtime/openapi"),
      import("@/mocks/runtime/catalog"),
    ])
  const [operations, overrideById] = await Promise.all([
    readMockOperations(),
    readBackendOverrides(),
  ])

  return Response.json({
    operations: getMockOperationStates(operations, overrideById),
  })
}
