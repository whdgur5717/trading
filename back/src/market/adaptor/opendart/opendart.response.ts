import { isAxiosError } from "axios"
import { err, ok, type Result } from "neverthrow"
import type { z } from "zod"
import type { HttpResponse } from "../../../common/http/httpRequest.provider"
import {
  type OpendartFailure,
  type OpendartRequestFailure,
  type OpendartResponseFailure,
} from "./opendart.error"
import {
  OPENDART_NO_DATA_STATUS,
  OPENDART_SUCCESS_STATUS,
} from "./opendart.protocol"
import { opendartStatusSchema } from "./opendart.schema"

type OpendartStatusDecision =
  | { readonly type: "success" }
  | { readonly type: "no-data" }
  | { readonly type: "failure"; readonly error: OpendartFailure }

export function dataFromOpendartResponse(
  response: HttpResponse,
  path: string
): Result<unknown, OpendartResponseFailure> {
  if (response.status < 200 || response.status >= 300) {
    return err({
      service: "opendart",
      code:
        response.status === 401 || response.status === 403
          ? "auth-unavailable"
          : "unavailable",
      message: response.statusText || "OpenDART HTTP error",
      endpoint: path,
      upstreamStatus: response.status,
    })
  }

  return ok(response.data)
}

export function parseRequiredOpendartResponse<TSchema extends z.ZodType>(
  path: string,
  data: unknown,
  schema: TSchema
): Result<z.output<TSchema>, OpendartFailure> {
  const decision = opendartStatusDecision(path, data)

  switch (decision.type) {
    case "success":
      return parseOpendartBody(path, data, schema)
    case "no-data":
      return err({
        service: "opendart",
        code: "not-found",
        message: "OpenDART response has no data",
        endpoint: path,
      })
    case "failure":
      return err(decision.error)
  }
}

export function parseOpendartListResponse<TSchema extends z.ZodType>(
  path: string,
  data: unknown,
  schema: TSchema
): Result<z.output<TSchema>, OpendartFailure> {
  const decision = opendartStatusDecision(path, data)

  switch (decision.type) {
    case "success":
      return parseOpendartBody(path, data, schema)
    case "no-data":
      return parseOpendartBody(
        path,
        { status: OPENDART_SUCCESS_STATUS, list: [] },
        schema
      )
    case "failure":
      return err(decision.error)
  }
}

export function opendartRequestFailure(
  path: string,
  error: unknown
): OpendartRequestFailure {
  const code = isAxiosError(error) ? error.code : undefined
  const message =
    error instanceof Error ? error.message : "OpenDART request failed"

  return {
    service: "opendart",
    code:
      code === "ECONNABORTED" || code === "ETIMEDOUT"
        ? "timeout"
        : "unavailable",
    message,
    endpoint: path,
    upstreamCode: code,
    cause: error,
  }
}

function opendartStatusDecision(
  path: string,
  data: unknown
): OpendartStatusDecision {
  const parsed = opendartStatusSchema.safeParse(data)

  if (!parsed.success) {
    return {
      type: "failure",
      error: {
        service: "opendart",
        code: "invalid-response",
        message: "OpenDART response status is invalid",
        endpoint: path,
      },
    }
  }

  switch (parsed.data.status) {
    case OPENDART_SUCCESS_STATUS:
      return { type: "success" }
    case OPENDART_NO_DATA_STATUS:
      return { type: "no-data" }
    case "010":
    case "011":
    case "020":
      return {
        type: "failure",
        error: {
          service: "opendart",
          code: "auth-unavailable",
          message: parsed.data.message ?? "OpenDART authorization failed",
          endpoint: path,
          upstreamCode: parsed.data.status,
        },
      }
    default:
      return {
        type: "failure",
        error: {
          service: "opendart",
          code: "unavailable",
          message: parsed.data.message ?? "OpenDART API error",
          endpoint: path,
          upstreamCode: parsed.data.status,
        },
      }
  }
}

function parseOpendartBody<TSchema extends z.ZodType>(
  path: string,
  data: unknown,
  schema: TSchema
): Result<z.output<TSchema>, OpendartFailure> {
  const parsed = schema.safeParse(data)

  if (!parsed.success) {
    return err({
      service: "opendart",
      code: "invalid-response",
      message: "OpenDART response does not match schema",
      endpoint: path,
    })
  }

  return ok(parsed.data)
}
