import { Controller, Get, Query, UseInterceptors } from "@nestjs/common"
import { ApiResponseInterceptor } from "../common/api/response"
import { CandlesQueryDto } from "./candles.dto"
import { CandlesService } from "./candles.service"

@UseInterceptors(ApiResponseInterceptor)
@Controller("candles")
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get()
  candles(@Query() query: CandlesQueryDto) {
    return this.candlesService.getCandles(query)
  }
}
