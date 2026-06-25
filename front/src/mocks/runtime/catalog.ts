import type {
  MockOperation,
  MockOperationState,
  MockOverride,
  MockResponseTemplate,
} from "./types"

export function getMockOperation(
  operationId: string,
  operations: readonly MockOperation[]
): MockOperation | undefined {
  return operations.find((operation) => operation.operationId === operationId)
}

export function getMockResponseTemplate(
  operation: MockOperation,
  responseId: string
): MockResponseTemplate | undefined {
  return operation.responses.find(
    (response) => response.responseId === responseId
  )
}

export function getMockOperationStates(
  operations: readonly MockOperation[],
  overrideById: ReadonlyMap<string, MockOverride>
): MockOperationState[] {
  return operations.map((operation) => ({
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    request: operation.request,
    responses: operation.responses,
    override: overrideById.get(operation.operationId) ?? null,
  }))
}
