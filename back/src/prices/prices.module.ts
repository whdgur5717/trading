import { Module } from "@nestjs/common"
import { ExternalModule } from "../external/external.module"
import { StocksModule } from "../stocks/stocks.module"
import { PricesController } from "./prices.controller"
import { PricesService } from "./prices.service"

@Module({
  imports: [ExternalModule, StocksModule],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
