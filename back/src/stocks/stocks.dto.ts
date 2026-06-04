import { createZodDto } from "nestjs-zod"
import {
  stockCodeParamSchema,
  stockSchema,
  stockSearchQuerySchema,
} from "./stock.schema"

export class StockSearchQueryDto extends createZodDto(stockSearchQuerySchema) {}

export class StockCodeParamDto extends createZodDto(stockCodeParamSchema) {}

export class StockDto extends createZodDto(stockSchema) {}
