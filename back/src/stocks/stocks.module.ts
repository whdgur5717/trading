import { Module } from "@nestjs/common"
import { SuggestionService } from "./suggestion/suggestion.service"
import { STOCK_MASTER_DATA, stockMasterData } from "./stocks.data"
import { StocksController } from "./stocks.controller"
import { StocksService } from "./stocks.service"

@Module({
  controllers: [StocksController],
  providers: [
    {
      provide: STOCK_MASTER_DATA,
      useValue: stockMasterData,
    },
    StocksService,
    SuggestionService,
  ],
  exports: [StocksService],
})
export class StocksModule {}
