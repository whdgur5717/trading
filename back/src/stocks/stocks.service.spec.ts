import { Test } from "@nestjs/testing"
import { STOCK_MASTER_DATA } from "./stocks.data"
import { StocksService } from "./stocks.service"
import { beforeEach, describe, expect, it } from "vitest"

describe("StocksService", () => {
  let service: StocksService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: STOCK_MASTER_DATA,
          useValue: [
            {
              symbol: "005930",
              name: "삼성전자",
              marketName: "KOSPI",
              quotationMarket: "KRX",
            },
            {
              symbol: "005935",
              name: "삼성전자우",
              marketName: "KOSPI",
              quotationMarket: "KRX",
            },
            {
              symbol: "000660",
              name: "SK하이닉스",
              marketName: "KOSPI",
              quotationMarket: "KRX",
            },
          ],
        },
      ],
    }).compile()

    service = moduleRef.get(StocksService)
  })

  it("searches local stock master data by Korean name and code", () => {
    expect(service.search("삼성")).toEqual([
      {
        symbol: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      },
      {
        symbol: "005935",
        name: "삼성전자우",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      },
    ])

    expect(service.search("000660")).toEqual([
      {
        symbol: "000660",
        name: "SK하이닉스",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      },
    ])
  })

  it("normalizes duplicate query matches into one result per stock code", () => {
    expect(service.search("005930 삼성전자")).toEqual([
      {
        symbol: "005930",
        name: "삼성전자",
        marketName: "KOSPI",
        quotationMarket: "KRX",
      },
    ])
  })
})
