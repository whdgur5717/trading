import { Module } from "@nestjs/common"
import { KisRealtimeTradeFeedModule } from "./adaptor/kis/realtime.module"

@Module({
  imports: [KisRealtimeTradeFeedModule],
  exports: [KisRealtimeTradeFeedModule],
})
export class RealtimeTradeFeedModule {}
