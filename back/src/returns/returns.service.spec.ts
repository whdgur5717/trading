import { Test } from "@nestjs/testing"
import { ok } from "neverthrow"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CandlesService } from "../candles/candles.service"
import {
  PricesServiceMock,
  PricesTestingModule,
} from "../prices/testing/prices-testing.module"
import { PricesService } from "../prices/prices.service"
import {
  StocksServiceMock,
  StocksTestingModule,
} from "../stocks/testing/stocks-testing.module"
import { StocksService } from "../stocks/stocks.service"
import { ReturnsService } from "./returns.service"

class CandlesServiceMock {
  getCandles = vi.fn<CandlesService["getCandles"]>()
}

describe("ReturnsService", () => {
  let service: ReturnsService
  let candlesService: CandlesServiceMock
  let pricesService: PricesServiceMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PricesTestingModule, StocksTestingModule],
      providers: [
        ReturnsService,
        {
          provide: CandlesService,
          useClass: CandlesServiceMock,
        },
      ],
    }).compile()

    service = moduleRef.get(ReturnsService)
    candlesService = moduleRef.get(CandlesService)
    pricesService = moduleRef.get(PricesService)
    stocksService = moduleRef.get(StocksService)
  })

  it("calculates returns with historical buy price and current price", async () => {
    stocksService.getBySymbol.mockReturnValue(
      ok({
        symbol: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      })
    )
    candlesService.getCandles.mockResolvedValue(
      ok({
        symbol: "005930",
        interval: "1d",
        candles: [
          {
            timestamp: "2026-05-07T09:00:00+09:00",
            openPrice: "272000",
            highPrice: "277000",
            lowPrice: "260000",
            closePrice: "271500",
            volume: "41404687",
          },
        ],
        nextBefore: "2026-05-07T09:00:00+09:00",
      })
    )
    pricesService.getPrice.mockResolvedValue(
      ok({
        symbol: "005930",
        currentPrice: "300000",
        openPrice: "298000",
        highPrice: "301000",
        lowPrice: "297000",
        volume: "123456",
        changePrice: "2000",
        changeRate: "0.67",
      })
    )

    const result = await service.calculate("005930", "2026-05-07", 10)

    const value = result.match(
      (value) => value,
      (error) => {
        throw new Error(error.message ?? error.type)
      }
    )

    expect(value).toMatchObject({
      stock: {
        symbol: "005930",
      },
      buy: {
        date: "2026-05-07",
        price: "271500",
        quantity: 10,
      },
      current: {
        currentPrice: "300000",
      },
      result: {
        buyAmount: 2715000,
        currentValue: 3000000,
        profit: 285000,
        profitRate: 10.5,
      },
    })

    expect(candlesService.getCandles).toHaveBeenCalledWith({
      symbol: "005930",
      interval: "1d",
      before: "2026-05-07",
      count: 1,
    })
    expect(pricesService.getPrice).toHaveBeenCalledWith("005930")
  })
})
