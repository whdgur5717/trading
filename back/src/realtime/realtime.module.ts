import { Module } from "@nestjs/common"
import { ExternalModule } from "../external/external.module"
import { StocksModule } from "../stocks/stocks.module"
import { LocalRealtimeBroker } from "./broker/local/local-realtime-broker"
import { RealtimeBroker } from "./broker/realtime-broker.contract"
import { RealtimeController } from "./inbound/controller"
import { RealtimeService } from "./realtime.service"

@Module({
  imports: [ExternalModule, StocksModule],
  controllers: [RealtimeController],
  providers: [
    RealtimeService,
    {
      provide: RealtimeBroker,
      useClass: LocalRealtimeBroker,
    },
  ],
})
export class RealtimeModule {}
