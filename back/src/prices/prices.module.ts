import { Module } from "@nestjs/common"
import { KisModule } from "../kis/kis.module"
import { StocksModule } from "../stocks/stocks.module"
import { PricesController } from "./prices.controller"
import { PricesService } from "./prices.service"

@Module({
  imports: [KisModule, StocksModule],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
