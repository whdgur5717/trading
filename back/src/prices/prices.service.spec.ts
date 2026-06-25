import { Test } from "@nestjs/testing"
import { ok } from "neverthrow"
import { beforeEach, describe, expect, it } from "vitest"
import {
  MarketServiceMock,
  MarketTestingModule,
} from "../market/testing/marketTesting.module"
import { MarketService } from "../market/market.service"
import {
  StocksServiceMock,
  StocksTestingModule,
} from "../stocks/testing/stocks-testing.module"
import { StocksService } from "../stocks/stocks.service"
import { PricesService } from "./prices.service"

describe("PricesService", () => {
  let service: PricesService
  let marketService: MarketServiceMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketTestingModule, StocksTestingModule],
      providers: [PricesService],
    }).compile()

    service = moduleRef.get(PricesService)
    marketService = moduleRef.get(MarketService)
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
    marketService.price.mockResolvedValue(
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
    expect(marketService.price).toHaveBeenCalledWith({
      symbol: "005930",
      quotationMarket: "KRX",
    })
  })
})
