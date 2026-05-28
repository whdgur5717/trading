import ky, { isHTTPError } from "ky"
import { ApiErrorDtoSchema, type ApiErrorDto } from "./generated/schemas"

export const apiBaseUrl =
  typeof window === "undefined" ? `${process.env.APP_ORIGIN}/api` : "/api"

export class ApiError extends Error {
  constructor(readonly body: ApiErrorDto["error"]) {
    super(body.message)
    this.name = "ApiError"
  }
}

export const api = ky
  .create({
    prefix: apiBaseUrl,
    throwHttpErrors: true,
  })
  .extend({
    hooks: {
      beforeError: [
        ({ error }) => {
          if (!isHTTPError(error)) {
            return error
          }

          const result = ApiErrorDtoSchema.safeParse(error.data)

          if (!result.success) {
            return error
          }

          return new ApiError(result.data.error)
        },
      ],
    },
  })
