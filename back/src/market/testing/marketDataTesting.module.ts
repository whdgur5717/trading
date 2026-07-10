import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { MARKET_DATA_PORT, type MarketDataPort } from "../port/data"

export class MarketDataPortMock {
  price = vi.fn<MarketDataPort["price"]>()
  candles = vi.fn<MarketDataPort["candles"]>()
  marketDay = vi.fn<MarketDataPort["marketDay"]>()
  dailyStocks = vi.fn<MarketDataPort["dailyStocks"]>()
  dailyIndexes = vi.fn<MarketDataPort["dailyIndexes"]>()
  corpCode = vi.fn<MarketDataPort["corpCode"]>()
  company = vi.fn<MarketDataPort["company"]>()
  disclosures = vi.fn<MarketDataPort["disclosures"]>()
  financialAccounts = vi.fn<MarketDataPort["financialAccounts"]>()
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
