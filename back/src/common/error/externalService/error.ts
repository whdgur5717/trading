import type { ExternalServiceCode } from "./code"

export type ExternalServiceError<
  Code extends ExternalServiceCode = ExternalServiceCode,
> = Code extends ExternalServiceCode
  ? {
      readonly service: string
      readonly code: Code
      readonly message: string
      readonly endpoint?: string | undefined
      readonly upstreamStatus?: number | undefined
      readonly upstreamCode?: string | undefined
      readonly cause?: unknown
    }
  : never
