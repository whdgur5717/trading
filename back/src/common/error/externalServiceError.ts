export type ExternalServiceErrorKind =
  | "business"
  | "http"
  | "invalidResponse"
  | "transport"

interface ExternalServiceErrorDetails {
  service: string
  kind: ExternalServiceErrorKind
  upstreamEndpoint?: string
  upstreamStatus?: number
  upstreamCode?: string
}

interface ExternalServiceErrorOptions {
  service: string
  kind: ExternalServiceErrorKind
  endpoint?: string
  status?: number
  code?: string
  body?: unknown
  cause?: unknown
}

export class ExternalServiceError extends Error {
  readonly service: string
  readonly kind: ExternalServiceErrorKind
  readonly endpoint?: string
  readonly status?: number
  readonly code?: string
  readonly body?: unknown
  readonly details: ExternalServiceErrorDetails
  override readonly cause?: unknown

  constructor(message: string, options: ExternalServiceErrorOptions) {
    super(message)
    this.name = "ExternalServiceError"
    this.service = options.service
    this.kind = options.kind
    this.endpoint = options.endpoint
    this.status = options.status
    this.code = options.code
    this.body = options.body
    this.details = {
      service: options.service,
      kind: options.kind,
      ...(options.endpoint === undefined
        ? {}
        : { upstreamEndpoint: options.endpoint }),
      ...(options.status === undefined
        ? {}
        : { upstreamStatus: options.status }),
      ...(options.code === undefined ? {} : { upstreamCode: options.code }),
    }
    this.cause = options.cause
  }
}
