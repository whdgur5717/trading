import { Module } from "@nestjs/common"
import { FscModule } from "./adaptor/fsc/fsc.module"
import { KisMarketDataModule } from "./adaptor/kis/data.module"
import { OpendartModule } from "./adaptor/opendart/opendart.module"
import { MarketService } from "./market.service"

@Module({
  imports: [KisMarketDataModule, FscModule, OpendartModule],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
