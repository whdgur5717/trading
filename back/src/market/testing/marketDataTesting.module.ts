import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { MARKET_DATA_PORT, type MarketDataPort } from "../port/data"

export class MarketDataPortMock {
  price = vi.fn<MarketDataPort["price"]>()
  candles = vi.fn<MarketDataPort["candles"]>()
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
