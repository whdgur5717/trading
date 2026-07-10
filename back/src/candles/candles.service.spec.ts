import { Test } from "@nestjs/testing"
import { ok } from "neverthrow"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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
import { CandlesService } from "./candles.service"

describe("CandlesService", () => {
  let service: CandlesService
  let marketService: MarketServiceMock
  let stocksService: StocksServiceMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketTestingModule, StocksTestingModule],
      providers: [CandlesService],
    }).compile()

    service = moduleRef.get(CandlesService)
    marketService = moduleRef.get(MarketService)
    stocksService = moduleRef.get(StocksService)
  })

  afterEach(() => {
    vi.useRealTimers()
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
    marketService.candles.mockResolvedValue(
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

    expect(marketService.candles).toHaveBeenCalledWith({
      symbol: "005930",
      interval: "1d",
      count: 1,
      before: "2026-05-17",
      quotationMarket: "KRX",
    })
  })

  it("keeps requesting older pages until the requested start date is included", async () => {
    vi.setSystemTime(new Date("2026-07-10T00:00:00+09:00"))

    stocksService.getBySymbol.mockReturnValue(
      ok({
        symbol: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      })
    )
    marketService.candles
      .mockResolvedValueOnce(
        ok(
          Array.from({ length: 100 }, (_, index) => ({
            date: new Date(Date.UTC(2026, 6, 10 - index))
              .toISOString()
              .slice(0, 10),
            openPrice: 69000,
            highPrice: 71000,
            lowPrice: 68000,
            closePrice: 70000,
            volume: 12345678,
          }))
        )
      )
      .mockResolvedValueOnce(
        ok([
          {
            date: "2026-04-02",
            openPrice: 69000,
            highPrice: 71000,
            lowPrice: 68000,
            closePrice: 70000,
            volume: 12345678,
          },
          {
            date: "2026-04-01",
            openPrice: 69000,
            highPrice: 71000,
            lowPrice: 68000,
            closePrice: 70000,
            volume: 12345678,
          },
          {
            date: "2026-03-31",
            openPrice: 68000,
            highPrice: 70000,
            lowPrice: 67000,
            closePrice: 69000,
            volume: 12345678,
          },
        ])
      )

    const result = await service.getCandlesFromDate({
      symbol: "005930",
      interval: "1d",
      from: "2026-04-01",
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }
    expect(result.value.candles.at(0)?.timestamp).toBe(
      "2026-04-01T09:00:00+09:00"
    )
    expect(result.value.candles.at(-1)?.timestamp).toBe(
      "2026-07-10T09:00:00+09:00"
    )
    expect(result.value.candles).toHaveLength(101)
    expect(marketService.candles).toHaveBeenNthCalledWith(1, {
      symbol: "005930",
      interval: "1d",
      count: 100,
      before: "2026-07-10",
      quotationMarket: "KRX",
    })
    expect(marketService.candles).toHaveBeenNthCalledWith(2, {
      symbol: "005930",
      interval: "1d",
      count: 100,
      before: "2026-04-02",
      quotationMarket: "KRX",
    })
  })
})
