import { Module } from "@nestjs/common"
import { FscModule } from "./adaptor/fsc/fsc.module"
import { KisMarketDataModule } from "./adaptor/kis/data.module"
import { OpendartModule } from "./adaptor/opendart/opendart.module"
import { MarketDataAdaptor } from "./marketData.adaptor"
import { MarketService } from "./market.service"
import { MARKET_DATA_PORT } from "./port/data"

@Module({
  imports: [KisMarketDataModule, FscModule, OpendartModule],
  providers: [
    MarketDataAdaptor,
    {
      provide: MARKET_DATA_PORT,
      useExisting: MarketDataAdaptor,
    },
    MarketService,
  ],
  exports: [MarketService],
})
export class MarketModule {}
