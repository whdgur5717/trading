import { Controller, Get, Query } from "@nestjs/common"
import { PriceQueryDto } from "./prices.dto"
import { PricesService } from "./prices.service"

@Controller("prices")
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  price(@Query() query: PriceQueryDto) {
    return this.pricesService.getPrice(query.symbol)
  }
}
