import { err, ok, type Result } from "neverthrow"
import type { z } from "zod"
import type { ExternalServiceError } from "../../../common/error/externalService/error"
import type { HttpResponse } from "../../../common/http/httpRequest.provider"
import { httpErrorMessageSchema, responseMetaSchema } from "./schema"

export type KisResponseScope = "authorization" | "market-data"
export type KisAuthorizationError = ExternalServiceError<
  "auth-unavailable" | "invalid-response"
>
type KisMarketDataEnvelopeError = ExternalServiceError<
  "unavailable" | "auth-unavailable"
>
export type KisMarketDataResponseError = ExternalServiceError<
  "unavailable" | "auth-unavailable" | "invalid-response"
>

function errorFromResponse(
  response: HttpResponse,
  path: string,
  scope: "authorization"
): KisAuthorizationError | null
function errorFromResponse(
  response: HttpResponse,
  path: string,
  scope: "market-data"
): KisMarketDataEnvelopeError | null
function errorFromResponse(
  response: HttpResponse,
  path: string,
  scope: KisResponseScope
): KisAuthorizationError | KisMarketDataEnvelopeError | null {
  if (response.status < 200 || response.status >= 300) {
    const message = httpErrorMessageSchema.safeParse(response.data)
    const upstreamCode = message.success ? message.data.msg_cd : undefined
    const upstreamMessage = message.success ? message.data.msg1 : undefined
    const reason =
      scope === "authorization" ||
      response.status === 401 ||
      response.status === 403
        ? "auth-unavailable"
        : "unavailable"

    return {
      service: "kis",
      code: reason,
      message: upstreamMessage || response.statusText || "KIS HTTP error",
      endpoint: path,
      upstreamStatus: response.status,
      upstreamCode,
    }
  }

  const meta = responseMetaSchema.safeParse(response.data)
  const upstreamCode = meta.success ? meta.data.msg_cd : undefined
  const upstreamMessage = meta.success ? meta.data.msg1 : undefined

  if (meta.success && meta.data.rt_cd !== "0") {
    const reason =
      scope === "authorization" ||
      /token|auth|인증|토큰|만료|expired|unauthorized/.test(
        `${upstreamCode ?? ""} ${upstreamMessage ?? ""}`.toLowerCase()
      )
        ? "auth-unavailable"
        : "unavailable"

    return {
      service: "kis",
      code: reason,
      message: upstreamMessage || upstreamCode || "KIS business error",
      endpoint: path,
      upstreamStatus: response.status,
      upstreamCode,
    }
  }

  return null
}

export function dataFromResponse<TSchema extends z.ZodType>(
  response: HttpResponse,
  path: string,
  schema: TSchema,
  scope: "authorization"
): Result<z.output<TSchema>, KisAuthorizationError>
export function dataFromResponse<TSchema extends z.ZodType>(
  response: HttpResponse,
  path: string,
  schema: TSchema,
  scope: "market-data"
): Result<z.output<TSchema>, KisMarketDataResponseError>
export function dataFromResponse<TSchema extends z.ZodType>(
  response: HttpResponse,
  path: string,
  schema: TSchema,
  scope: KisResponseScope
): Result<
  z.output<TSchema>,
  KisAuthorizationError | KisMarketDataResponseError
> {
  const failure =
    scope === "authorization"
      ? errorFromResponse(response, path, "authorization")
      : errorFromResponse(response, path, "market-data")

  if (failure) {
    return err(failure)
  }

  const result = schema.safeParse(response.data)

  if (!result.success) {
    if (scope === "authorization") {
      return err({
        service: "kis",
        code: "invalid-response",
        message: "KIS response does not match schema",
        endpoint: path,
        upstreamStatus: response.status,
      })
    }

    return err({
      service: "kis",
      code: "invalid-response",
      message: "KIS response does not match schema",
      endpoint: path,
      upstreamStatus: response.status,
    })
  }

  return ok(result.data)
}
