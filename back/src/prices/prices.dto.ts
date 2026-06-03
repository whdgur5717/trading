import { createZodDto } from "nestjs-zod"
import {
  priceCodeParamSchema,
  priceCurrentSchema,
  priceDailyCandleQuerySchema,
  priceDailyCandleSchema,
  priceQuoteSchema,
} from "./prices.schema"

export class PriceCodeParamDto extends createZodDto(priceCodeParamSchema) {}

export class PriceDailyCandleQueryDto extends createZodDto(
  priceDailyCandleQuerySchema
) {}

export class PriceCurrentDto extends createZodDto(priceCurrentSchema) {}

export class PriceQuoteDto extends createZodDto(priceQuoteSchema) {}

export class PriceDailyCandleDto extends createZodDto(priceDailyCandleSchema) {}
