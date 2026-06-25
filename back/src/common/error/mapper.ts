import { API_ERRORS } from "./error-catalog"
import { ApiError, type ApplicationError } from "./error"

export const apiErrorMapper = {
  toApiError(exception: unknown): ApiError {
    if (isApiError(exception)) {
      return exception
    }

    if (isApplicationError(exception)) {
      return new ApiError(exception.type, {
        message: exception.message,
        details: exception.details,
      })
    }

    return new ApiError("internal-error")
  },
}

function isApiError(exception: unknown): exception is ApiError {
  return exception instanceof ApiError
}

function isApplicationError(exception: unknown): exception is ApplicationError {
  if (!exception || typeof exception !== "object") {
    return false
  }

  if (!("type" in exception) || typeof exception.type !== "string") {
    return false
  }

  if (!(exception.type in API_ERRORS)) {
    return false
  }

  return !(
    "message" in exception &&
    exception.message !== undefined &&
    typeof exception.message !== "string"
  )
}
