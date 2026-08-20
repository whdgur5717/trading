import { Test } from "@nestjs/testing"
import { ok } from "neverthrow"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ExternalService } from "../external/external.service"
import {
  StocksServiceMock,
  StocksTestingModule,
} from "../stocks/testing/stocks-testing.module"
import { StocksService } from "../stocks/stocks.service"
import { PricesService } from "./prices.service"

class ExternalServiceMock {
  price = vi.fn<ExternalService["price"]>()
}

describe("PricesService", () => {
  let service: PricesService
  let externalService: ExternalServiceMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StocksTestingModule],
      providers: [
        PricesService,
        {
          provide: ExternalService,
          useClass: ExternalServiceMock,
        },
      ],
    }).compile()

    service = moduleRef.get(PricesService)
    externalService = moduleRef.get(ExternalService)
    stocksService = moduleRef.get(StocksService)
  })

  it("returns current price data for the requested stock symbol", async () => {
    stocksService.getBySymbol.mockReturnValue(
      ok({
        symbol: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      })
    )
    externalService.price.mockResolvedValue(
      ok({
        currentPrice: 70000,
        openPrice: 69000,
        highPrice: 71000,
        lowPrice: 68000,
        volume: 12345678,
        changePrice: 1000,
        changeRate: 1.45,
      })
    )

    const result = await service.getPrice("005930")

    const value = result.match(
      (value) => value,
      (error) => {
        throw new Error(error.message ?? error.type)
      }
    )

    expect(value).toEqual({
      symbol: "005930",
      currentPrice: "70000",
      openPrice: "69000",
      highPrice: "71000",
      lowPrice: "68000",
      volume: "12345678",
      changePrice: "1000",
      changeRate: "1.45",
    })

    expect(stocksService.getBySymbol).toHaveBeenCalledWith("005930")
    expect(externalService.price).toHaveBeenCalledWith({
      symbol: "005930",
      quotationMarket: "KRX",
    })
  })
})
