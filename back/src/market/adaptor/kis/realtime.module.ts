import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { REALTIME_TRADE_FEED_PORT } from "../../port/realtime"
import { AuthorizationProvider } from "./authorization.provider"
import { RealtimeAdaptor } from "./realtime.adaptor"

@Module({
  imports: [HttpRequestModule],
  providers: [
    AuthorizationProvider,
    RealtimeAdaptor,
    {
      provide: REALTIME_TRADE_FEED_PORT,
      useExisting: RealtimeAdaptor,
    },
  ],
  exports: [REALTIME_TRADE_FEED_PORT],
})
export class KisRealtimeTradeFeedModule {}
