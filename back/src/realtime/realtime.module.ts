import { Module } from "@nestjs/common"
import { RealtimeTradeFeedModule } from "../market/realtime.module"
import { StocksModule } from "../stocks/stocks.module"
import { RealtimeController } from "./realtime.controller"
import { RealtimeService } from "./realtime.service"

@Module({
  imports: [RealtimeTradeFeedModule, StocksModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
})
export class RealtimeModule {}
