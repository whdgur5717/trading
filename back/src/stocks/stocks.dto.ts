import { createZodDto } from "nestjs-zod"
import {
  stockCodeParamSchema,
  stockCurrentSchema,
  stockHistoryQuerySchema,
  stockHistorySchema,
  stockSchema,
  stockSearchQuerySchema,
} from "./stock.schema"

export class StockSearchQueryDto extends createZodDto(stockSearchQuerySchema) {}

export class StockCodeParamDto extends createZodDto(stockCodeParamSchema) {}

export class StockHistoryQueryDto extends createZodDto(
  stockHistoryQuerySchema
) {}

export class StockDto extends createZodDto(stockSchema) {}

export class StockCurrentDto extends createZodDto(stockCurrentSchema) {}

export class StockHistoryDto extends createZodDto(stockHistorySchema) {}
