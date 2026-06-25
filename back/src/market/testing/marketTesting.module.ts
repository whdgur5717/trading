import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { MarketService } from "../market.service"

export class MarketServiceMock {
  price = vi.fn<MarketService["price"]>()
  candles = vi.fn<MarketService["candles"]>()
  marketDay = vi.fn<MarketService["marketDay"]>()
  dailyStocks = vi.fn<MarketService["dailyStocks"]>()
  dailyIndexes = vi.fn<MarketService["dailyIndexes"]>()
  corpCode = vi.fn<MarketService["corpCode"]>()
  company = vi.fn<MarketService["company"]>()
  disclosures = vi.fn<MarketService["disclosures"]>()
  financialAccounts = vi.fn<MarketService["financialAccounts"]>()
}

@Module({
  providers: [
    {
      provide: MarketService,
      useClass: MarketServiceMock,
    },
  ],
  exports: [MarketService],
})
export class MarketTestingModule {}
