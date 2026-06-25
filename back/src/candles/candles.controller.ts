import { Controller, Get, Query } from "@nestjs/common"
import { CandlesQueryDto } from "./candles.dto"
import { CandlesService } from "./candles.service"

@Controller("candles")
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get()
  candles(@Query() query: CandlesQueryDto) {
    return this.candlesService.getCandles(query)
  }
}
