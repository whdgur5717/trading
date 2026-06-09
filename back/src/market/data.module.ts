import { Module } from "@nestjs/common"
import { KisMarketDataModule } from "./adaptor/kis/data.module"

@Module({
  imports: [KisMarketDataModule],
  exports: [KisMarketDataModule],
})
export class MarketDataModule {}
