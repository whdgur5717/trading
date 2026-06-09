import type { z } from "zod"
import { ExternalServiceError } from "../../../common/error/externalServiceError"
import type { HttpResponse } from "../../../common/http/httpRequest.provider"
import { httpErrorMessageSchema, responseMetaSchema } from "./schema"

export function errorFromResponse(
  response: HttpResponse,
  path: string
): ExternalServiceError | null {
  if (response.status < 200 || response.status >= 300) {
    const message = httpErrorMessageSchema.safeParse(response.data)
    const upstreamCode = message.success ? message.data.msg_cd : undefined
    const upstreamMessage = message.success ? message.data.msg1 : undefined

    return new ExternalServiceError(
      upstreamMessage || response.statusText || "KIS HTTP error",
      {
        service: "kis",
        kind: "http",
        endpoint: path,
        status: response.status,
        code: upstreamCode,
        body: response.data,
      }
    )
  }

  const meta = responseMetaSchema.safeParse(response.data)
  const upstreamCode = meta.success ? meta.data.msg_cd : undefined
  const upstreamMessage = meta.success ? meta.data.msg1 : undefined

  if (meta.success && meta.data.rt_cd !== "0") {
    return new ExternalServiceError(
      upstreamMessage || upstreamCode || "KIS business error",
      {
        service: "kis",
        kind: "business",
        endpoint: path,
        status: response.status,
        code: upstreamCode,
        body: response.data,
      }
    )
  }

  return null
}

export function dataFromResponse<TSchema extends z.ZodType>(
  response: HttpResponse,
  path: string,
  schema: TSchema
): z.output<TSchema> {
  const result = schema.safeParse(response.data)

  if (!result.success) {
    throw new ExternalServiceError("KIS response does not match schema", {
      service: "kis",
      kind: "invalidResponse",
      endpoint: path,
      status: response.status,
      body: {
        issues: result.error.issues,
        response: response.data,
      },
    })
  }

  return result.data
}
