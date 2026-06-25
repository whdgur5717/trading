import { Module } from "@nestjs/common"
import { CandlesModule } from "../candles/candles.module"
import { PricesModule } from "../prices/prices.module"
import { StocksModule } from "../stocks/stocks.module"
import { ReturnsController } from "./returns.controller"
import { ReturnsService } from "./returns.service"

@Module({
  imports: [CandlesModule, PricesModule, StocksModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
