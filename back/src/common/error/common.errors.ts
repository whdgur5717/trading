import { z } from "zod"
import { defineErrors, type ErrorOf } from "./define"

export const commonErrors = defineErrors({
  invalidRequest: {
    type: "common.invalid_request",
    status: 400,
    message: "Validation failed",
    description:
      "The request query, path parameter, or body does not match the API contract.",
    data: z.object({
      issues: z
        .array(z.unknown())
        .meta({ example: [{ path: ["symbol"], message: "Required" }] }),
    }),
  },
  internal: {
    type: "common.internal",
    status: 500,
    message: "Internal server error",
    description: "The server failed before the request could be completed.",
    data: z.object({}),
  },
})

export type CommonInvalidRequestError = ErrorOf<
  typeof commonErrors.invalidRequest
>
export type CommonInternalError = ErrorOf<typeof commonErrors.internal>
export type CommonError = ErrorOf<typeof commonErrors>
