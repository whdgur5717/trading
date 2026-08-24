import { Module } from "@nestjs/common"
import { ExternalModule } from "../external/external.module"
import { StocksModule } from "../stocks/stocks.module"
import { RealtimeController } from "./realtime.controller"
import { RealtimeService } from "./realtime.service"

@Module({
  imports: [ExternalModule, StocksModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
})
export class RealtimeModule {}
