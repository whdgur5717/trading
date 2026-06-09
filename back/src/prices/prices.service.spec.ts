import { Test } from "@nestjs/testing"
import {
  MarketDataPortMock,
  MarketDataTestingModule,
} from "../market/testing/marketDataTesting.module"
import { MARKET_DATA_PORT } from "../market/port/data"
import {
  StocksServiceMock,
  StocksTestingModule,
} from "../stocks/testing/stocks-testing.module"
import { StocksService } from "../stocks/stocks.service"
import { PricesService } from "./prices.service"
import { beforeEach, describe, expect, it } from "vitest"

describe("PricesService", () => {
  let service: PricesService
  let marketData: MarketDataPortMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketDataTestingModule, StocksTestingModule],
      providers: [PricesService],
    }).compile()

    service = moduleRef.get(PricesService)
    marketData = moduleRef.get(MARKET_DATA_PORT)
    stocksService = moduleRef.get(StocksService)
  })

  it("gets the current price with the stock quotation market", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      quotationMarket: "KRX",
    })
    marketData.stockQuote.mockResolvedValue({
      currentPrice: 70000,
      openPrice: 69000,
      highPrice: 71000,
      lowPrice: 68000,
      accumulatedVolume: 12345678,
      previousDayChange: 1000,
      previousDayChangeRate: 1.45,
    })
    await expect(service.getQuote("005930")).resolves.toMatchObject({
      stock: {
        code: "005930",
      },
      quotationMarket: "KRX",
      price: {
        currentPrice: 70000,
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(marketData.stockQuote).toHaveBeenCalledWith({
      stockCode: "005930",
      quotationMarket: "KRX",
    })
  })

  it("gets the historical close with the stock quotation market", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      quotationMarket: "KRX",
    })
    marketData.marketDay.mockResolvedValue({
      date: "2026-05-07",
      quotationMarket: "KRX",
      isBusinessDay: true,
      isTradingDay: true,
      isOpenDay: true,
      isSettlementDay: true,
    })
    marketData.dailyCandle.mockResolvedValue({
      date: "2026-05-07",
      openPrice: 69000,
      highPrice: 71000,
      lowPrice: 68000,
      closePrice: 70000,
      accumulatedVolume: 12345678,
    })
    await expect(
      service.getDailyCandle("005930", "2026-05-07")
    ).resolves.toMatchObject({
      requestedDate: "2026-05-07",
      quotationMarket: "KRX",
      isTradingDay: true,
      candle: {
        closePrice: 70000,
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(marketData.marketDay).toHaveBeenCalledWith({
      date: "2026-05-07",
      quotationMarket: "KRX",
    })
    expect(marketData.dailyCandle).toHaveBeenCalledWith({
      stockCode: "005930",
      date: "2026-05-07",
      quotationMarket: "KRX",
    })
  })

  it("uses the unified current snapshot during an open market day", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      quotationMarket: "KRX",
    })
    marketData.marketDay.mockResolvedValue({
      date: "2026-06-03",
      quotationMarket: "CONSOLIDATED",
      isBusinessDay: true,
      isTradingDay: true,
      isOpenDay: true,
      isSettlementDay: true,
    })
    marketData.stockQuote.mockResolvedValue({
      currentPrice: 70000,
      openPrice: 69000,
      highPrice: 71000,
      lowPrice: 68000,
      accumulatedVolume: 12345678,
      previousDayChange: 1000,
      previousDayChangeRate: 1.45,
    })
    await expect(
      service.getCurrentPrice("005930", new Date("2026-06-03T00:00:01.000Z"))
    ).resolves.toEqual({
      price: 70000,
      source: "stock-quote",
      quotationMarket: "CONSOLIDATED",
      basis: {
        type: "current-snapshot",
        requestedAt: "2026-06-03T09:00:01+09:00",
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(marketData.marketDay).toHaveBeenCalledWith({
      date: "2026-06-03",
      quotationMarket: "CONSOLIDATED",
    })
    expect(marketData.stockQuote).toHaveBeenCalledWith({
      stockCode: "005930",
      quotationMarket: "CONSOLIDATED",
    })
    expect(marketData.lastTradingDayCandle).not.toHaveBeenCalled()
  })

  it("uses the latest close when the unified market is closed", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      quotationMarket: "KRX",
    })
    marketData.marketDay.mockResolvedValue({
      date: "2026-06-03",
      quotationMarket: "CONSOLIDATED",
      isBusinessDay: true,
      isTradingDay: true,
      isOpenDay: false,
      isSettlementDay: true,
    })
    marketData.lastTradingDayCandle.mockResolvedValue({
      date: "2026-06-02",
      openPrice: 69000,
      highPrice: 71000,
      lowPrice: 68000,
      closePrice: 70500,
      accumulatedVolume: 22345678,
    })
    await expect(
      service.getCurrentPrice("005930", new Date("2026-06-03T11:00:00.000Z"))
    ).resolves.toEqual({
      price: 70500,
      source: "daily-candle",
      quotationMarket: "CONSOLIDATED",
      basis: {
        type: "latest-close",
        tradingDate: "2026-06-02",
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(marketData.marketDay).toHaveBeenCalledWith({
      date: "2026-06-03",
      quotationMarket: "CONSOLIDATED",
    })
    expect(marketData.lastTradingDayCandle).toHaveBeenCalledWith({
      stockCode: "005930",
      asOfDate: "2026-06-03",
      quotationMarket: "CONSOLIDATED",
    })
    expect(marketData.stockQuote).not.toHaveBeenCalled()
  })
})
