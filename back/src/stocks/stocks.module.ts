import { Module } from "@nestjs/common"
import { KisModule } from "../kis/kis.module"
import { STOCK_MASTER_DATA, stockMasterData } from "./stocks.data"
import { StocksController } from "./stocks.controller"
import { StocksService } from "./stocks.service"

@Module({
  imports: [KisModule],
  controllers: [StocksController],
  providers: [
    {
      provide: STOCK_MASTER_DATA,
      useValue: stockMasterData,
    },
    StocksService,
  ],
  exports: [StocksService],
})
export class StocksModule {}
