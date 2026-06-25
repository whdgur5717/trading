import { createZodDto } from "nestjs-zod"
import {
  stockSchema,
  stockSearchQuerySchema,
  stockSymbolParamSchema,
} from "./stock.schema"

export class StockSearchQueryDto extends createZodDto(stockSearchQuerySchema) {}

export class StockSymbolParamDto extends createZodDto(stockSymbolParamSchema) {}

export class StockDto extends createZodDto(stockSchema) {}
