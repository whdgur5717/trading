import { API_ERRORS, type ErrorCode } from "./error-catalog"

type ApiErrorOptions = {
  message?: string
  details?: unknown
}

export type ApplicationError<Code extends ErrorCode = ErrorCode> = {
  readonly type: Code
  readonly message?: string
  readonly details?: unknown
}

export class ApiError<Code extends ErrorCode = ErrorCode> extends Error {
  readonly code: Code
  readonly details: unknown

  constructor(code: Code, options: ApiErrorOptions = {}) {
    const definition = API_ERRORS[code]
    super(options.message ?? definition.message)
    this.name = "ApiError"
    this.code = code
    this.details = options.details
  }
}
