export type MockMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type MockContentType = "application/json" | "text/event-stream"

export type MockResponseTemplate = {
  responseId: string
  status: number
  label: string
  contentType: MockContentType
  body: unknown
}

export type MockRequestTemplate = {
  path: string
  query: Record<string, unknown>
}

export type MockOperation = {
  operationId: string
  method: MockMethod
  path: string
  request: MockRequestTemplate
  responses: MockResponseTemplate[]
}

export type MockOverride = {
  enabled: boolean
  responseId: string
  status: number
  body: unknown
  delayMs?: number
}

export type MockOperationState = {
  operationId: string
  method: MockMethod
  path: string
  request: MockRequestTemplate
  responses: MockResponseTemplate[]
  override: MockOverride | null
}
