import { createZodValidationPipe } from "nestjs-zod"
import { ZodError } from "zod"
import { ApiError } from "../error/error"

function createZodValidationError(error: unknown) {
  switch (true) {
    case error instanceof ZodError:
      return new ApiError("invalid-request", {
        message: "Validation failed",
        details: error.issues,
      })
    default:
      return new ApiError("invalid-request", {
        message: "Validation failed",
      })
  }
}

export const ZodDtoValidationPipe = createZodValidationPipe({
  createValidationException: createZodValidationError,
})
