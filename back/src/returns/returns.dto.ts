import { createZodDto } from "nestjs-zod"
import {
  returnBuySchema,
  returnCalculationSchema,
  returnCurrentSchema,
  returnSummarySchema,
  returnsQuerySchema,
} from "./returns.schema"

export class ReturnsQueryDto extends createZodDto(returnsQuerySchema) {}

export class ReturnBuyDto extends createZodDto(returnBuySchema) {}

export class ReturnCurrentDto extends createZodDto(returnCurrentSchema) {}

export class ReturnCalculationDto extends createZodDto(
  returnCalculationSchema
) {}

export class ReturnSummaryDto extends createZodDto(returnSummarySchema) {}
