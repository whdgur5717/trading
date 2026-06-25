import { Test } from "@nestjs/testing"
import { ok } from "neverthrow"
import { beforeEach, describe, expect, it } from "vitest"
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
import { CandlesService } from "./candles.service"

describe("CandlesService", () => {
  let service: CandlesService
  let marketData: MarketDataPortMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketDataTestingModule, StocksTestingModule],
      providers: [CandlesService],
    }).compile()

    service = moduleRef.get(CandlesService)
    marketData = moduleRef.get(MARKET_DATA_PORT)
    stocksService = moduleRef.get(StocksService)
  })

  it("returns candles for the requested stock symbol and interval", async () => {
    stocksService.getBySymbol.mockReturnValue(
      ok({
        symbol: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      })
    )
    marketData.candles.mockResolvedValue(
      ok([
        {
          date: "2026-05-17",
          openPrice: 69000,
          highPrice: 71000,
          lowPrice: 68000,
          closePrice: 70000,
          volume: 12345678,
        },
      ])
    )

    const result = await service.getCandles({
      symbol: "005930",
      interval: "1d",
      count: 1,
      before: "2026-05-17",
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }
    expect(result.value).toEqual({
      symbol: "005930",
      interval: "1d",
      candles: [
        {
          timestamp: "2026-05-17T09:00:00+09:00",
          openPrice: "69000",
          highPrice: "71000",
          lowPrice: "68000",
          closePrice: "70000",
          volume: "12345678",
        },
      ],
      nextBefore: "2026-05-17",
    })

    expect(marketData.candles).toHaveBeenCalledWith({
      symbol: "005930",
      interval: "1d",
      count: 1,
      before: "2026-05-17",
      quotationMarket: "KRX",
    })
  })
})
