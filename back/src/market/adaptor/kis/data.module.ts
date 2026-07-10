import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { AuthorizationProvider } from "./authorization.provider"
import { KisMarketDataAdaptor } from "./marketData.adaptor"
import { RequestQueueProvider } from "./request-queue.provider"
import { RequestProvider } from "./request.provider"

@Module({
  imports: [HttpRequestModule],
  providers: [
    AuthorizationProvider,
    RequestQueueProvider,
    RequestProvider,
    KisMarketDataAdaptor,
  ],
  exports: [KisMarketDataAdaptor],
})
export class KisMarketDataModule {}
