import { Module } from "@nestjs/common"
import { KisModule } from "../kis/kis.module"
import { StocksModule } from "../stocks/stocks.module"
import { ReturnsCalculatorService } from "./returns-calculator.service"
import { ReturnsController } from "./returns.controller"
import { ReturnsService } from "./returns.service"

@Module({
  imports: [KisModule, StocksModule],
  controllers: [ReturnsController],
  providers: [ReturnsCalculatorService, ReturnsService],
})
export class ReturnsModule {}
