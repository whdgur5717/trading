import { createZodDto } from "nestjs-zod"
import { priceQuerySchema, priceSchema } from "./prices.schema"

export class PriceQueryDto extends createZodDto(priceQuerySchema) {}

export class PriceDto extends createZodDto(priceSchema) {}
