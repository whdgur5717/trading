import { ConfigService } from "@nestjs/config"
import { Test } from "@nestjs/testing"
import { describe, expect, it, vi } from "vitest"
import { HttpRequestProvider } from "../../../common/http/httpRequest.provider"
import {
  HttpRequestProviderMock,
  HttpRequestTestingModule,
} from "../../../common/http/testing/httpRequestTesting.module"
import { MARKET_DATA_ERRORS } from "../../market-data.error"
import { OpendartAdaptor } from "./opendart.adaptor"
import { OPENDART_BASE_URL, opendartRest } from "./opendart.protocol"

describe("OpendartAdaptor", () => {
  it("resolves a stock code to the OpenDART corp code", async () => {
    const adaptor = await createAdaptor(vi.fn<HttpRequestProvider["request"]>())

    const result = adaptor.corpCode("005930")

    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }

    expect(result.value).toBe("00126380")
  })

  it("returns safe not-found messages when OpenDART corp code cannot be resolved", async () => {
    const adaptor = await createAdaptor(vi.fn<HttpRequestProvider["request"]>())

    const invalid = adaptor.corpCode("not-a-secret-symbol")
    const missing = adaptor.corpCode("000000")

    expect(invalid.isErr()).toBe(true)
    expect(missing.isErr()).toBe(true)

    if (invalid.isErr()) {
      expect(invalid.error).toEqual({
        type: "market-data-not-found",
        message: MARKET_DATA_ERRORS["market-data-not-found"].message,
        details: { service: "opendart", stockCode: "not-a-secret-symbol" },
      })
    }

    if (missing.isErr()) {
      expect(missing.error).toEqual({
        type: "market-data-not-found",
        message: MARKET_DATA_ERRORS["market-data-not-found"].message,
        details: { service: "opendart", stockCode: "000000" },
      })
    }
  })

  it("returns company profile data from OpenDART company response", async () => {
    const request = vi.fn<HttpRequestProvider["request"]>().mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {
        status: "000",
        message: "정상",
        corp_code: "00126380",
        corp_name: "삼성전자(주)",
        stock_code: "005930",
        stock_name: "삼성전자",
        corp_cls: "Y",
        induty_code: "264",
        est_dt: "19690113",
        acc_mt: "12",
      },
    })
    const adaptor = await createAdaptor(request)

    const result = await adaptor.company("00126380")

    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }

    expect(result.value).toEqual({
      corpCode: "00126380",
      corpName: "삼성전자(주)",
      stockCode: "005930",
      stockName: "삼성전자",
      corpClass: "Y",
      industryCode: "264",
      establishedDate: "19690113",
      settlementMonth: "12",
    })
    expect(request).toHaveBeenCalledWith({
      method: "GET",
      url: `${OPENDART_BASE_URL}${opendartRest.company}`,
      query: {
        crtfc_key: "dart-key",
        corp_code: "00126380",
      },
    })
  })

  it("returns an empty list when OpenDART list response has no data", async () => {
    const request = vi.fn<HttpRequestProvider["request"]>().mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {
        status: "013",
        message: "조회된 데이타가 없습니다.",
      },
    })
    const adaptor = await createAdaptor(request)

    const result = await adaptor.disclosures({
      corpCode: "00126380",
      beginDate: "20240101",
      endDate: "20241231",
    })

    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }

    expect(result.value).toEqual([])
  })
})

async function createAdaptor(request: HttpRequestProvider["request"]) {
  const moduleRef = await Test.createTestingModule({
    imports: [HttpRequestTestingModule],
    providers: [
      OpendartAdaptor,
      {
        provide: ConfigService,
        useValue: { getOrThrow: () => "dart-key" },
      },
    ],
  }).compile()
  const http = moduleRef.get<HttpRequestProviderMock>(HttpRequestProvider)

  http.request.mockImplementation(request)

  return moduleRef.get(OpendartAdaptor)
}
