import { err, ok, type Result } from "neverthrow"
import type { z } from "zod"
import type { HttpResponse } from "../../../common/http/httpRequest.provider"
import type { FscResponseFailure } from "./fsc.error"
import { fscErrorHeaderSchema } from "./fsc.schema"

export function dataFromFscResponse<TSchema extends z.ZodType>(
  response: HttpResponse,
  path: string,
  schema: TSchema
): Result<z.output<TSchema>, FscResponseFailure> {
  if (response.status < 200 || response.status >= 300) {
    return err({
      service: "fsc",
      code:
        response.status === 401 || response.status === 403
          ? "auth-unavailable"
          : "unavailable",
      message: response.statusText || "FSC HTTP error",
      endpoint: path,
      upstreamStatus: response.status,
    })
  }

  const header = fscErrorHeaderSchema.safeParse(response.data)

  if (header.success && header.data.response.header.resultCode !== "00") {
    const errorHeader = header.data.response.header

    return err({
      service: "fsc",
      code: "unavailable",
      message: errorHeader.resultMsg ?? errorHeader.resultCode,
      endpoint: path,
      upstreamStatus: response.status,
      upstreamCode: errorHeader.resultCode,
    })
  }

  const parsed = schema.safeParse(response.data)

  if (!parsed.success) {
    return err({
      service: "fsc",
      code: "invalid-response",
      message: "FSC response does not match schema",
      endpoint: path,
      upstreamStatus: response.status,
    })
  }

  return ok(parsed.data)
}
