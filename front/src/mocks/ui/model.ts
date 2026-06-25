import type {
  MockContentType,
  MockOperationState,
  MockResponseTemplate,
} from "@/mocks/runtime/types"

export type MockPanelSelection = {
  operationId: string
  responseId: string
  bodyText: string
  requestUrl: string
}

export const emptySelection: MockPanelSelection = {
  operationId: "",
  responseId: "",
  bodyText: "",
  requestUrl: "",
}

export function responseBodyText(value: unknown): string {
  if (value === undefined) {
    return ""
  }

  return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}

export function editableResponseBody(
  text: string,
  contentType: MockContentType
): unknown {
  return contentType === "application/json" ||
    contentType === "text/event-stream"
    ? JSON.parse(text)
    : text
}

export function requestUrl(operation: MockOperationState): string {
  const searchParams = new URLSearchParams()

  for (const [name, value] of Object.entries(operation.request.query)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(name, String(item))
      }
      continue
    }

    searchParams.set(name, String(value))
  }

  const query = searchParams.toString()

  return `/api${operation.request.path}${query ? `?${query}` : ""}`
}

export function preferredOperation(
  operations: readonly MockOperationState[],
  operationId: string
): MockOperationState | undefined {
  return (
    operations.find((operation) => operation.operationId === operationId) ??
    operations.find((operation) => operation.path === "/prices") ??
    operations[0]
  )
}

export function responseTemplate(
  operation: MockOperationState | undefined,
  responseId: string
): MockResponseTemplate | undefined {
  return operation?.responses.find(
    (response) => response.responseId === responseId
  )
}

export function selectionForOperation(
  operation: MockOperationState | undefined
): MockPanelSelection {
  if (!operation) {
    return emptySelection
  }

  const response =
    operation.responses.find(
      (item) => item.responseId === operation.override?.responseId
    ) ?? operation.responses[0]

  return {
    operationId: operation.operationId,
    responseId: response?.responseId ?? "",
    bodyText: responseBodyText(
      operation.override?.body ?? response?.body ?? null
    ),
    requestUrl: requestUrl(operation),
  }
}
