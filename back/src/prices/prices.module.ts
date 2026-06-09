import { Module } from "@nestjs/common"
import { MarketDataModule } from "../market/data.module"
import { StocksModule } from "../stocks/stocks.module"
import { PricesController } from "./prices.controller"
import { PricesService } from "./prices.service"

@Module({
  imports: [MarketDataModule, StocksModule],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
