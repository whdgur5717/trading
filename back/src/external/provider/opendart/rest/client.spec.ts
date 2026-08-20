import { ConfigService } from "@nestjs/config"
import { Test } from "@nestjs/testing"
import { describe, expect, it, vi } from "vitest"
import { rest } from "#generated/opendart/rest/api"
import { HttpRequestProvider } from "../../../../common/http/httpRequest.provider"
import {
  HttpRequestProviderMock,
  HttpRequestTestingModule,
} from "../../../../common/http/testing/httpRequestTesting.module"
import { OpendartClient } from "./client"

const config = {
  DART_API_KEY: "dart-key",
  OPENDART_REST_BASE_URL: "http://opendart.test",
}

describe("OpendartClient", () => {
  it("종목 코드에 해당하는 OpenDART 고유번호를 찾는다", async () => {
    const adaptor = await createAdaptor(vi.fn<HttpRequestProvider["request"]>())

    const result = adaptor.corpCode("005930")

    if (result.isErr()) {
      throw new Error(result.error.message ?? result.error.type)
    }

    expect(result.value).toBe("00126380")
  })

  it("OpenDART 고유번호를 찾지 못하면 안전한 데이터 없음 오류를 반환한다", async () => {
    const adaptor = await createAdaptor(vi.fn<HttpRequestProvider["request"]>())

    const invalid = adaptor.corpCode("not-a-secret-symbol")
    const missing = adaptor.corpCode("000000")

    expect(invalid.isErr()).toBe(true)
    expect(missing.isErr()).toBe(true)

    if (invalid.isErr()) {
      expect(invalid.error).toEqual({
        type: "market.data_not_found",
        status: 404,
        message: "Market data was not found",
        data: {
          provider: "opendart",
          endpoint: "corp-code-map",
          upstreamStatus: null,
          upstreamCode: null,
        },
      })
    }

    if (missing.isErr()) {
      expect(missing.error).toEqual({
        type: "market.data_not_found",
        status: 404,
        message: "Market data was not found",
        data: {
          provider: "opendart",
          endpoint: "corp-code-map",
          upstreamStatus: null,
          upstreamCode: null,
        },
      })
    }
  })

  it("OpenDART 기업 응답을 회사 개요로 변환한다", async () => {
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
      symbol: "005930",
      stockName: "삼성전자",
      corpClass: "Y",
      industryCode: "264",
      establishedDate: "19690113",
      settlementMonth: "12",
    })
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        url: `${config.OPENDART_REST_BASE_URL}${rest.opendartCompany.path}`,
        query: {
          crtfc_key: config.DART_API_KEY,
          corp_code: "00126380",
        },
        validateStatus: expect.any(Function),
      })
    )
  })

  it("OpenDART 회사 개요 조회에서 데이터 없음 응답은 시장 데이터 없음 오류로 반환한다", async () => {
    const request = vi.fn<HttpRequestProvider["request"]>().mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {
        status: "013",
        message: "조회된 데이타가 없습니다.",
      },
    })
    const adaptor = await createAdaptor(request)

    const result = await adaptor.company("00126380")

    expect(result.isErr()).toBe(true)

    if (result.isErr()) {
      expect(result.error).toEqual({
        type: "market.data_not_found",
        status: 404,
        message: "Market data was not found",
        data: {
          provider: "opendart",
          endpoint: rest.opendartCompany.path,
          upstreamStatus: 200,
          upstreamCode: "013",
        },
      })
    }
  })

  it("OpenDART 목록 응답에 데이터가 없으면 빈 목록을 반환한다", async () => {
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
      OpendartClient,
      {
        provide: ConfigService,
        useValue: {
          getOrThrow: (key: keyof typeof config) => config[key],
        },
      },
    ],
  }).compile()
  const http = moduleRef.get<HttpRequestProviderMock>(HttpRequestProvider)

  http.request.mockImplementation(request)

  return moduleRef.get(OpendartClient)
}
