import { Test } from "@nestjs/testing"
import { ok } from "neverthrow"
import { describe, expect, it } from "vitest"
import {
  MarketDataPortMock,
  MarketDataTestingModule,
} from "./testing/marketDataTesting.module"
import { MarketService } from "./market.service"
import { MARKET_DATA_PORT } from "./port/data"

describe("MarketService", () => {
  it("외부 제공자 구현체를 직접 알지 않고 시장 데이터 포트로 위임한다", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketDataTestingModule],
      providers: [MarketService],
    }).compile()
    const service = moduleRef.get(MarketService)
    const marketData = moduleRef.get<MarketDataPortMock>(MARKET_DATA_PORT)
    const price = ok({
      currentPrice: 78000,
      openPrice: 77500,
      highPrice: 78500,
      lowPrice: 77000,
      volume: 12345678,
      changePrice: 500,
      changeRate: 0.65,
    })
    const candles = ok([
      {
        date: "2026-07-09",
        openPrice: 77500,
        highPrice: 78500,
        lowPrice: 77000,
        closePrice: 78000,
        volume: 12345678,
      },
    ])
    const marketDay = ok({
      date: "2026-07-09",
      quotationMarket: "KRX" as const,
      isBusinessDay: true,
      isTradingDay: true,
      isOpenDay: true,
      isSettlementDay: true,
    })
    const dailyStocks = ok([])
    const dailyIndexes = ok([])
    const corpCode = ok("00126380")
    const company = ok({
      corpCode: "00126380",
      corpName: "삼성전자(주)",
      stockCode: "005930",
      stockName: "삼성전자",
      corpClass: "Y",
      industryCode: "264",
      establishedDate: "19690113",
      settlementMonth: "12",
    })
    const disclosures = ok([])
    const financialAccounts = ok([])

    marketData.price.mockResolvedValue(price)
    marketData.candles.mockResolvedValue(candles)
    marketData.marketDay.mockResolvedValue(marketDay)
    marketData.dailyStocks.mockResolvedValue(dailyStocks)
    marketData.dailyIndexes.mockResolvedValue(dailyIndexes)
    marketData.corpCode.mockReturnValue(corpCode)
    marketData.company.mockResolvedValue(company)
    marketData.disclosures.mockResolvedValue(disclosures)
    marketData.financialAccounts.mockResolvedValue(financialAccounts)

    await expect(
      service.price({ symbol: "005930", quotationMarket: "KRX" })
    ).resolves.toBe(price)
    await expect(
      service.candles({
        symbol: "005930",
        interval: "1d",
        before: "2026-07-09",
        count: 1,
        quotationMarket: "KRX",
      })
    ).resolves.toBe(candles)
    await expect(
      service.marketDay({ date: "2026-07-09", quotationMarket: "KRX" })
    ).resolves.toBe(marketDay)
    await expect(service.dailyStocks("2026-07-09")).resolves.toBe(dailyStocks)
    await expect(service.dailyIndexes("2026-07-09")).resolves.toBe(dailyIndexes)
    expect(service.corpCode("005930")).toBe(corpCode)
    await expect(service.company("00126380")).resolves.toBe(company)
    await expect(
      service.disclosures({
        corpCode: "00126380",
        beginDate: "20260101",
        endDate: "20261231",
      })
    ).resolves.toBe(disclosures)
    await expect(
      service.financialAccounts({
        corpCode: "00126380",
        businessYear: "2026",
        reportCode: "11011",
      })
    ).resolves.toBe(financialAccounts)
  })
})
