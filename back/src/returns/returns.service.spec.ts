import { Test } from "@nestjs/testing"
import {
  PricesServiceMock,
  PricesTestingModule,
} from "../prices/testing/prices-testing.module"
import { PricesService } from "../prices/prices.service"
import { ReturnsService } from "./returns.service"
import { beforeEach, describe, expect, it } from "vitest"

describe("ReturnsService", () => {
  let service: ReturnsService
  let pricesService: PricesServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PricesTestingModule],
      providers: [ReturnsService],
    }).compile()

    service = moduleRef.get(ReturnsService)
    pricesService = moduleRef.get<PricesServiceMock>(PricesService)
  })

  it("calculates returns with historical buy price and current price", async () => {
    pricesService.getDailyCandle.mockResolvedValue({
      stock: {
        code: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        kisMarketCode: "J",
      },
      requestedDate: "2026-05-07",
      marketCode: "J",
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
    pricesService.getCurrentPrice.mockResolvedValue({
      price: 300000,
      source: "kis-rest-current-price",
      marketCode: "UN",
      basis: {
        type: "current-snapshot",
        requestedAt: "2026-06-03T09:00:01+09:00",
      },
    })
    await expect(
      service.calculate("005930", "2026-05-07", 10)
    ).resolves.toMatchObject({
      stock: {
        code: "005930",
      },
      buy: {
        date: "2026-05-07",
        price: 271500,
        quantity: 10,
      },
      current: {
        price: 300000,
        marketCode: "UN",
        basis: {
          type: "current-snapshot",
        },
      },
      result: {
        buyAmount: 2715000,
        currentValue: 3000000,
        profit: 285000,
        profitRate: 10.5,
      },
    })

    expect(pricesService.getDailyCandle).toHaveBeenCalledWith(
      "005930",
      "2026-05-07"
    )
    expect(pricesService.getCurrentPrice).toHaveBeenCalledWith("005930")
  })
})
