import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { MARKET_DATA_PORT } from "../../port/data"
import { AuthorizationProvider } from "./authorization.provider"
import { MarketDataAdaptor } from "./marketData.adaptor"
import { RequestProvider } from "./request.provider"

@Module({
  imports: [HttpRequestModule],
  providers: [
    AuthorizationProvider,
    RequestProvider,
    MarketDataAdaptor,
    {
      provide: MARKET_DATA_PORT,
      useExisting: MarketDataAdaptor,
    },
  ],
  exports: [MARKET_DATA_PORT],
})
export class KisMarketDataModule {}
