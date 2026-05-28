import { ConfigService } from "@nestjs/config"
import { KisService } from "../kis/kis.service"
import { StocksService } from "../stocks/stocks.service"
import { ReturnsCalculatorService } from "./returns-calculator.service"
import { ReturnsService } from "./returns.service"
import { describe, expect, it, vi } from "vitest"

describe("ReturnsService", () => {
  it("calculates returns with historical and current prices", async () => {
    const stock = {
      code: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      kisMarketCode: "J" as const,
    }
    const stocksService = new StocksService([stock])
    const kisService = new KisService(new ConfigService())
    const getDailyPriceSpy = vi
      .spyOn(kisService, "getDailyPrice")
      .mockResolvedValue({
        isTradingDay: true,
        candle: {
          date: "20260507",
          openPrice: 272000,
          highPrice: 277000,
          lowPrice: 260000,
          closePrice: 271500,
          accumulatedVolume: 41404687,
        },
      })
    const getCurrentPriceSpy = vi
      .spyOn(kisService, "getCurrentPrice")
      .mockResolvedValue({
        currentPrice: 300000,
        openPrice: 299000,
        highPrice: 301000,
        lowPrice: 298000,
        accumulatedVolume: 1000,
        previousDayChange: 1000,
        previousDayChangeRate: 0.33,
      })
    const service = new ReturnsService(
      stocksService,
      kisService,
      new ReturnsCalculatorService()
    )

    await expect(
      service.calculate("005930", "2026-05-07", 10)
    ).resolves.toMatchObject({
      buy: {
        price: 271500,
        quantity: 10,
      },
      current: {
        price: 300000,
      },
      result: {
        buyAmount: 2715000,
        currentValue: 3000000,
        profit: 285000,
        profitRate: 10.5,
      },
    })

    expect(getDailyPriceSpy).toHaveBeenCalledWith("005930", "2026-05-07", "J")
    expect(getCurrentPriceSpy).toHaveBeenCalledTimes(1)
  })
})
