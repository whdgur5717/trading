import { Module } from "@nestjs/common"
import { MarketModule } from "../market/market.module"
import { StocksModule } from "../stocks/stocks.module"
import { PricesController } from "./prices.controller"
import { PricesService } from "./prices.service"

@Module({
  imports: [MarketModule, StocksModule],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
