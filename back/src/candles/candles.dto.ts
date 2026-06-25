import { createZodDto } from "nestjs-zod"
import { candlesQuerySchema, candlesSchema } from "./candles.schema"

export class CandlesQueryDto extends createZodDto(candlesQuerySchema) {}

export class CandlesDto extends createZodDto(candlesSchema) {}
