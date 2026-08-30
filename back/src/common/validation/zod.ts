import { HttpException } from "@nestjs/common"
import { createZodValidationPipe } from "nestjs-zod"
import { ZodError } from "zod"
import { commonErrors } from "../error/common.errors"

function createZodValidationError(error: unknown) {
  const invalidRequest = commonErrors.invalidRequest({
    issues: error instanceof ZodError ? error.issues : [],
  })

  return new HttpException(invalidRequest, invalidRequest.status)
}

export const ZodDtoValidationPipe = createZodValidationPipe({
  createValidationException: createZodValidationError,
})
