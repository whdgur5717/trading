import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { MARKET_PORT } from "../../realtime/ports/market"
import { KisService } from "../kis.service"

export class KisServiceMock {
  getCurrentPrice = vi.fn<KisService["getCurrentPrice"]>()
  getDailyPrice = vi.fn<KisService["getDailyPrice"]>()
  getLatestDailyClose = vi.fn<KisService["getLatestDailyClose"]>()
  getDomesticMarketDay = vi.fn<KisService["getDomesticMarketDay"]>()
  getUrl = vi.fn<KisService["getUrl"]>()
  getAuthKey = vi.fn<KisService["getAuthKey"]>()
  parseMessage = vi.fn<KisService["parseMessage"]>()
  createSubscriptionMessage = vi.fn<KisService["createSubscriptionMessage"]>()
}

@Module({
  providers: [
    {
      provide: KisService,
      useClass: KisServiceMock,
    },
    {
      provide: MARKET_PORT,
      useExisting: KisService,
    },
  ],
  exports: [KisService, MARKET_PORT],
})
export class KisTestingModule {}
