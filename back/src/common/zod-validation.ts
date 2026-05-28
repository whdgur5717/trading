import { BadRequestException } from "@nestjs/common"
import { createZodValidationPipe } from "nestjs-zod"
import { ZodError } from "zod"

function createZodBadRequestException(error: unknown) {
  if (error instanceof ZodError) {
    return new BadRequestException({
      message: "Validation failed",
      issues: error.issues,
    })
  }

  return new BadRequestException({ message: "Validation failed" })
}

export const ZodDtoValidationPipe = createZodValidationPipe({
  createValidationException: createZodBadRequestException,
})
