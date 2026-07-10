import { createZodValidationPipe } from "nestjs-zod"
import { ZodError } from "zod"
import { commonErrors } from "../error/common.errors"
import { definedErrorException } from "../error/define"

function createZodValidationError(error: unknown) {
  switch (true) {
    case error instanceof ZodError:
      return definedErrorException(
        commonErrors.invalidRequest({
          issues: error.issues,
        })
      )
    default:
      return definedErrorException(
        commonErrors.invalidRequest({
          issues: [],
        })
      )
  }
}

export const ZodDtoValidationPipe = createZodValidationPipe({
  createValidationException: createZodValidationError,
})
