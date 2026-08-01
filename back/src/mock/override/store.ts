import { Injectable } from "@nestjs/common"
import type { Override } from "./schema"

@Injectable()
export class OverrideStore {
  private readonly overrides = new Map<string, Override>()

  list(): Override[] {
    return Array.from(this.overrides.values())
  }

  set(override: Override): void {
    this.overrides.set(override.operationId, override)
  }

  delete(operationId: string): void {
    this.overrides.delete(operationId)
  }

  match(method: string, path: string): Override | undefined {
    return this.list().find(
      (override) =>
        override.enabled &&
        override.method === method &&
        pathMatches(override.path, path)
    )
  }

  reset(): void {
    this.overrides.clear()
  }
}

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
