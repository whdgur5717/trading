import { Controller, Get, Param, Query } from "@nestjs/common"
import {
  PriceCodeParamDto,
  PriceCurrentDto,
  PriceDailyCandleDto,
  PriceDailyCandleQueryDto,
  PriceQuoteDto,
} from "./prices.dto"
import { PricesService } from "./prices.service"

@Controller("prices")
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get(":code/current")
  current(@Param() params: PriceCodeParamDto): Promise<PriceCurrentDto> {
    return this.pricesService.getCurrentPrice(params.code)
  }

  @Get(":code/quote")
  quote(@Param() params: PriceCodeParamDto): Promise<PriceQuoteDto> {
    return this.pricesService.getQuote(params.code)
  }

  @Get(":code/daily-candle")
  dailyCandle(
    @Param() params: PriceCodeParamDto,
    @Query() query: PriceDailyCandleQueryDto
  ): Promise<PriceDailyCandleDto> {
    return this.pricesService.getDailyCandle(params.code, query.date)
  }
}
