import { Controller, Get, Query } from "@nestjs/common"
import { ReturnsQueryDto } from "./returns.dto"
import { ReturnsService } from "./returns.service"

@Controller("returns")
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  calculate(@Query() query: ReturnsQueryDto) {
    return this.returnsService.calculate(
      query.symbol,
      query.buyDate,
      query.quantity
    )
  }

  @Get("chart")
  chart(@Query() query: ReturnsQueryDto) {
    return this.returnsService.chart(
      query.symbol,
      query.buyDate,
      query.quantity
    )
  }
}
