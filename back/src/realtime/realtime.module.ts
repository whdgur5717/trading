import { Module } from "@nestjs/common"
import { KisModule } from "../kis/kis.module"
import { StocksModule } from "../stocks/stocks.module"
import { RealtimeController } from "./realtime.controller"
import { RealtimeService } from "./realtime.service"

@Module({
  imports: [KisModule, StocksModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
})
export class RealtimeModule {}
