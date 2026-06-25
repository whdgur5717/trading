import { Module } from "@nestjs/common"
import { MarketModule } from "../market/market.module"
import { StocksModule } from "../stocks/stocks.module"
import { CandlesController } from "./candles.controller"
import { CandlesService } from "./candles.service"

@Module({
  imports: [MarketModule, StocksModule],
  controllers: [CandlesController],
  providers: [CandlesService],
  exports: [CandlesService],
})
export class CandlesModule {}
