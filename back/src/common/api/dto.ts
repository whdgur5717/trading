import { createZodDto } from "nestjs-zod"
import {
  apiErrorDetailSchema,
  apiErrorSchema,
  apiSuccessSchema,
} from "./schema"

export class ApiSuccessDto extends createZodDto(apiSuccessSchema) {}

export class ApiErrorDetailDto extends createZodDto(apiErrorDetailSchema) {}

export class ApiErrorDto extends createZodDto(apiErrorSchema) {}
