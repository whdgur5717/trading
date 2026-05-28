import { Controller, Get, Query } from "@nestjs/common"
import { ReturnSummaryDto, ReturnsQueryDto } from "./returns.dto"
import { ReturnsService } from "./returns.service"

@Controller("returns")
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  calculate(@Query() query: ReturnsQueryDto): Promise<ReturnSummaryDto> {
    return this.returnsService.calculate(
      query.code,
      query.buyDate,
      query.quantity
    )
  }
}
