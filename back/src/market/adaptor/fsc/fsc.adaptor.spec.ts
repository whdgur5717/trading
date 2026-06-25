import { ConfigService } from "@nestjs/config"
import { Test } from "@nestjs/testing"
import { describe, expect, it } from "vitest"
import { HttpRequestProvider } from "../../../common/http/httpRequest.provider"
import {
  HttpRequestProviderMock,
  HttpRequestTestingModule,
} from "../../../common/http/testing/httpRequestTesting.module"
import { FscAdaptor } from "./fsc.adaptor"
import { FSC_BASE_URL, fscRest } from "./fsc.protocol"

describe("FscAdaptor", () => {
  it("returns daily stock rows when the public data response contains one item", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpRequestTestingModule],
      providers: [
        FscAdaptor,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => "public-data-key" },
        },
      ],
    }).compile()
    const adaptor = moduleRef.get(FscAdaptor)
    const http = moduleRef.get<HttpRequestProviderMock>(HttpRequestProvider)

    http.request.mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {
        response: {
          header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
          body: {
            items: {
              item: {
                basDt: "20240614",
                srtnCd: "005930",
                isinCd: "KR7005930003",
                itmsNm: "삼성전자",
                mrktCtg: "KOSPI",
                clpr: "75,000",
                fltRt: "-.24",
                mkp: "75,100",
                hipr: "76,000",
                lopr: "74,500",
                trqu: "12,345,678",
                trPrc: "925,925,850,000",
                lstgStCnt: "5,969,782,550",
                mrktTotAmt: "447,733,691,250,000",
              },
            },
          },
        },
      },
    })

    const result = await adaptor.dailyStocks("2024-06-14")

    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }

    expect(result.value).toEqual([
      {
        date: "2024-06-14",
        stockCode: "005930",
        isinCode: "KR7005930003",
        stockName: "삼성전자",
        market: "KOSPI",
        closePrice: 75000,
        dailyReturnPct: -0.24,
        openPrice: 75100,
        highPrice: 76000,
        lowPrice: 74500,
        volume: 12345678,
        tradeValue: 925925850000,
        listedShares: 5969782550,
        marketCap: 447733691250000,
      },
    ])
    expect(http.request).toHaveBeenCalledWith({
      method: "GET",
      url: `${FSC_BASE_URL}${fscRest.stockPriceInfo}`,
      query: {
        serviceKey: "public-data-key",
        resultType: "json",
        basDt: "20240614",
        numOfRows: "5000",
        pageNo: "1",
      },
    })
  })
})
