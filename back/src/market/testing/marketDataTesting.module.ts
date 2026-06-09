import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { MARKET_DATA_PORT, type MarketDataPort } from "../port/data"

export class MarketDataPortMock {
  stockQuote = vi.fn<MarketDataPort["stockQuote"]>()
  dailyCandle = vi.fn<MarketDataPort["dailyCandle"]>()
  lastTradingDayCandle = vi.fn<MarketDataPort["lastTradingDayCandle"]>()
  marketDay = vi.fn<MarketDataPort["marketDay"]>()
}

@Module({
  providers: [
    {
      provide: MARKET_DATA_PORT,
      useClass: MarketDataPortMock,
    },
  ],
  exports: [MARKET_DATA_PORT],
})
export class MarketDataTestingModule {}
