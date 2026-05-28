import { Module } from "@nestjs/common"
import { MARKET_PORT } from "../realtime/ports/market"
import { KisService } from "./kis.service"

@Module({
  providers: [
    KisService,
    {
      provide: MARKET_PORT,
      useExisting: KisService,
    },
  ],
  exports: [KisService, MARKET_PORT],
})
export class KisModule {}
