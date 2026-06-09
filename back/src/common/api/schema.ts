import { z } from "zod"

export const HTTP_ERROR_CODE_BY_STATUS = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_SUPPORTED",
  408: "TIMEOUT",
  409: "CONFLICT",
  412: "PRECONDITION_FAILED",
  413: "PAYLOAD_TOO_LARGE",
  422: "UNPROCESSABLE_CONTENT",
  429: "TOO_MANY_REQUESTS",
  499: "CLIENT_CLOSED_REQUEST",
  500: "INTERNAL_SERVER_ERROR",
  502: "BAD_GATEWAY",
  503: "SERVICE_UNAVAILABLE",
  504: "GATEWAY_TIMEOUT",
} as const

export type HttpErrorStatus = keyof typeof HTTP_ERROR_CODE_BY_STATUS
export type HttpErrorCode = (typeof HTTP_ERROR_CODE_BY_STATUS)[HttpErrorStatus]

export function isHttpErrorStatus(status: number): status is HttpErrorStatus {
  return Object.hasOwn(HTTP_ERROR_CODE_BY_STATUS, status)
}

export const exceptionResponseSchema = z
  .object({
    message: z.union([z.string(), z.array(z.string())]).optional(),
    issues: z.unknown().optional(),
    details: z.unknown().optional(),
  })
  .catchall(z.unknown())

export const apiSuccessSchema = z.object({
  success: z.literal(true).meta({ example: true }),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export const apiErrorDetailSchema = z.object({
  status: z
    .literal(Object.keys(HTTP_ERROR_CODE_BY_STATUS).map(Number))
    .meta({ example: 400 }),
  code: z.enum(HTTP_ERROR_CODE_BY_STATUS).meta({ example: "BAD_REQUEST" }),
  message: z.string().meta({ example: "Validation failed" }),
  details: z.unknown().optional(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false).meta({ example: false }),
  error: apiErrorDetailSchema,
})

export type ExceptionResponseBody = z.infer<typeof exceptionResponseSchema>
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>
export type ApiFailure = z.infer<typeof apiErrorSchema>
export type ApiSuccess<T> = z.infer<typeof apiSuccessSchema> & {
  data: T
}
