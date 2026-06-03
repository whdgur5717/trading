import { Test } from "@nestjs/testing"
import {
  KisServiceMock,
  KisTestingModule,
} from "../kis/testing/kis-testing.module"
import { KisService } from "../kis/kis.service"
import {
  StocksServiceMock,
  StocksTestingModule,
} from "../stocks/testing/stocks-testing.module"
import { StocksService } from "../stocks/stocks.service"
import { PricesService } from "./prices.service"
import { beforeEach, describe, expect, it } from "vitest"

describe("PricesService", () => {
  let service: PricesService
  let kisService: KisServiceMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [KisTestingModule, StocksTestingModule],
      providers: [PricesService],
    }).compile()

    service = moduleRef.get(PricesService)
    kisService = moduleRef.get(KisService)
    stocksService = moduleRef.get(StocksService)
  })

  it("gets the current price with the stock market code", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      kisMarketCode: "J",
    })
    kisService.getCurrentPrice.mockResolvedValue({
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
      marketCode: "J",
      price: {
        currentPrice: 70000,
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(kisService.getCurrentPrice).toHaveBeenCalledWith("005930", "J")
  })

  it("gets the historical close with the stock market code", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      kisMarketCode: "J",
    })
    kisService.getDailyPrice.mockResolvedValue({
      isTradingDay: true,
      candle: {
        date: "20260507",
        openPrice: 69000,
        highPrice: 71000,
        lowPrice: 68000,
        closePrice: 70000,
        accumulatedVolume: 12345678,
      },
    })
    await expect(
      service.getDailyCandle("005930", "2026-05-07")
    ).resolves.toMatchObject({
      requestedDate: "2026-05-07",
      marketCode: "J",
      isTradingDay: true,
      candle: {
        closePrice: 70000,
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(kisService.getDailyPrice).toHaveBeenCalledWith(
      "005930",
      "2026-05-07",
      "J"
    )
  })

  it("uses the unified current snapshot during an open market day", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      kisMarketCode: "J",
    })
    kisService.getDomesticMarketDay.mockResolvedValue({
      date: "20260603",
      isBusinessDay: true,
      isTradingDay: true,
      isOpenDay: true,
      isSettlementDay: true,
    })
    kisService.getCurrentPrice.mockResolvedValue({
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
      source: "kis-rest-current-price",
      marketCode: "UN",
      basis: {
        type: "current-snapshot",
        requestedAt: "2026-06-03T09:00:01+09:00",
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(kisService.getDomesticMarketDay).toHaveBeenCalledWith("20260603")
    expect(kisService.getCurrentPrice).toHaveBeenCalledWith("005930", "UN")
    expect(kisService.getLatestDailyClose).not.toHaveBeenCalled()
  })

  it("uses the latest close when the unified market is closed", async () => {
    stocksService.getByCode.mockReturnValue({
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      kisMarketCode: "J",
    })
    kisService.getDomesticMarketDay.mockResolvedValue({
      date: "20260603",
      isBusinessDay: true,
      isTradingDay: true,
      isOpenDay: false,
      isSettlementDay: true,
    })
    kisService.getLatestDailyClose.mockResolvedValue({
      date: "20260602",
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
      source: "kis-rest-daily-itemchartprice",
      marketCode: "UN",
      basis: {
        type: "latest-close",
        tradingDate: "20260602",
      },
    })

    expect(stocksService.getByCode).toHaveBeenCalledWith("005930")
    expect(kisService.getDomesticMarketDay).toHaveBeenCalledWith("20260603")
    expect(kisService.getLatestDailyClose).toHaveBeenCalledWith(
      "005930",
      "20260603",
      "UN"
    )
    expect(kisService.getCurrentPrice).not.toHaveBeenCalled()
  })
})
