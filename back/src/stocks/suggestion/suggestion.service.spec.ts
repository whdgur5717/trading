import { Test } from "@nestjs/testing"
import { beforeEach, describe, expect, it } from "vitest"
import type { Stock } from "../stock.schema"
import { STOCK_MASTER_DATA } from "../stocks.data"
import { SuggestionService } from "./suggestion.service"

describe("종목 추천 검색", () => {
  // 삼성 계열 일반주/우선주/ETF와 코드 검색용 ETN을 함께 두어
  // 매칭 방식과 상품 유형별 정렬 정책을 한 번에 검증한다.
  const stocks: Stock[] = [
    {
      symbol: "005930",
      name: "삼성전자",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "STOCK",
      marketCap: 1000,
      previousVolume: 1000,
      isKospi50: true,
      isKospi100: true,
      isKrx300: true,
    },
    {
      symbol: "005935",
      name: "삼성전자우",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "PREFERRED",
      marketCap: 100,
      previousVolume: 100,
    },
    {
      symbol: "009150",
      name: "삼성전기",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "STOCK",
      marketCap: 500,
      previousVolume: 500,
    },
    {
      symbol: "032830",
      name: "삼성생명",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "STOCK",
      marketCap: 400,
      previousVolume: 400,
    },
    {
      symbol: "448330",
      name: "KODEX 삼성전자채권혼합",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "ETF",
      marketCap: 900,
      previousVolume: 900,
    },
    {
      symbol: "Q500061",
      name: "신한 인버스 코스피 200 선물 ETN",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "ETN",
      marketCap: 50,
      previousVolume: 50,
    },
    {
      symbol: "000660",
      name: "SK하이닉스",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "STOCK",
      marketCap: 900,
      previousVolume: 900,
    },
    {
      symbol: "0030R0",
      name: "대신밸류리츠",
      marketName: "KOSPI",
      quotationMarket: "KRX",
      productType: "REIT",
      marketCap: 10,
      previousVolume: 10,
    },
  ]

  let service: SuggestionService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SuggestionService,
        {
          provide: STOCK_MASTER_DATA,
          useValue: stocks,
        },
      ],
    }).compile()

    service = moduleRef.get(SuggestionService)
  })

  it("'삼성'처럼 회사명을 검색하면 주요 상장사를 관련 ETF보다 먼저 보여준다", () => {
    expect(service.suggest("삼성", 10).items.map((item) => item.name)).toEqual([
      "삼성전자",
      "삼성전기",
      "삼성생명",
      "삼성전자우",
      "KODEX 삼성전자채권혼합",
    ])
  })

  it("'삼ㅈ', '삼성ㅈ'처럼 한글과 초성을 섞어 입력해도 삼성전자 계열 종목을 찾는다", () => {
    expect(service.suggest("삼ㅈ", 10).items.map((item) => item.name)).toEqual([
      "삼성전자",
      "삼성전기",
      "삼성전자우",
    ])

    expect(
      service.suggest("삼성ㅈ", 10).items.map((item) => item.name)
    ).toEqual(["삼성전자", "삼성전기", "삼성전자우"])
  })

  it("'ㅅㅈ'처럼 초성만 입력해도 종목명 초성 문자열에 매칭되는 종목을 찾는다", () => {
    expect(service.suggest("ㅅㅈ", 10).items.map((item) => item.name)).toEqual([
      "삼성전자",
      "삼성전기",
      "삼성전자우",
      "KODEX 삼성전자채권혼합",
    ])
  })

  it("'0059'처럼 종목코드 일부를 입력하면 해당 코드로 시작하는 종목을 찾는다", () => {
    expect(
      service.suggest("0059", 10).items.map((item) => item.symbol)
    ).toEqual(["005930", "005935"])
  })

  it("'KODEX 삼성', 'Q500'처럼 상품명이나 ETN 코드로 검색하면 ETF와 ETN을 찾는다", () => {
    expect(
      service.suggest("KODEX 삼성", 10).items.map((item) => item.name)
    ).toEqual(["KODEX 삼성전자채권혼합"])

    expect(service.suggest("Q500", 10).items.map((item) => item.name)).toEqual([
      "신한 인버스 코스피 200 선물 ETN",
    ])
  })

  it("'삼성' 검색 결과가 화면에 보여줄 개수보다 많으면 추가 결과가 있음을 알려준다", () => {
    expect(service.suggest("삼성", 2)).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ name: "삼성전자" }),
      ]),
      hasMore: true,
    })
  })
})
