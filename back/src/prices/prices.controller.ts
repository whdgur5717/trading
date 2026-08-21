import { Controller, Get, Query, UseInterceptors } from "@nestjs/common"
import { ApiResponseInterceptor } from "../common/api/response"
import { PriceQueryDto } from "./prices.dto"
import { PricesService } from "./prices.service"

@UseInterceptors(ApiResponseInterceptor)
@Controller("prices")
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  price(@Query() query: PriceQueryDto) {
    return this.pricesService.getPrice(query.symbol)
  }
}
