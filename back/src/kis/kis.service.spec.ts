import { BadGatewayException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Test } from "@nestjs/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { KisService } from "./kis.service"

const futureKisExpiry = "2099-01-01 00:00:00"

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function createConfig(): ConfigService {
  return new ConfigService({
    APP_KEY: "test-app-key",
    APP_SECRET: "test-app-secret",
    KIS_MARKET_CODE: "J",
    KIS_REALTIME_TR_ID: "H0STCNT0",
    KIS_REST_BASE_URL: "https://kis.example.test",
    KIS_WS_URL: "ws://kis.example.test",
  })
}

describe("KisService", () => {
  const originalFetch = global.fetch
  let service: KisService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        KisService,
        {
          provide: ConfigService,
          useValue: createConfig(),
        },
      ],
    }).compile()

    service = moduleRef.get(KisService)
  })

  afterEach(() => {
    vi.useRealTimers()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe("token cache", () => {
    it("동시에 가격을 조회해도 KIS token 발급 요청은 한 번만 보낸다", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "access-token-1",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "1",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output: {
              stck_prpr: "70000",
              stck_oprc: "69000",
              stck_hgpr: "71000",
              stck_lwpr: "68000",
              acml_vol: "1000",
              prdy_vrss: "500",
              prdy_ctrt: "0.72",
            },
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output2: [
              {
                stck_bsop_date: "20260507",
                stck_oprc: "69000",
                stck_hgpr: "71000",
                stck_lwpr: "68000",
                stck_clpr: "70000",
                acml_vol: "1000",
              },
            ],
          })
        )
      global.fetch = fetchMock

      await Promise.all([
        service.getCurrentPrice("005930", "J"),
        service.getDailyPrice("005930", "2026-05-07", "J"),
      ])

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls[0][0].toString()).toContain("/oauth2/tokenP")
      expect(fetchMock.mock.calls[1][0].toString()).toContain("/inquire-price")
      expect(fetchMock.mock.calls[2][0].toString()).toContain(
        "/inquire-daily-itemchartprice"
      )
    })

    it("유효한 token이 있으면 다음 KIS 요청에 재사용한다", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "access-token-1",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "1",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output: {
              stck_prpr: "70000",
              stck_oprc: "69000",
              stck_hgpr: "71000",
              stck_lwpr: "68000",
              acml_vol: "1000",
              prdy_vrss: "500",
              prdy_ctrt: "0.72",
            },
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output: {
              stck_prpr: "70000",
              stck_oprc: "69000",
              stck_hgpr: "71000",
              stck_lwpr: "68000",
              acml_vol: "1000",
              prdy_vrss: "500",
              prdy_ctrt: "0.72",
            },
          })
        )
      global.fetch = fetchMock

      await service.getCurrentPrice("005930", "J")
      await service.getCurrentPrice("005930", "J")

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls[0][0].toString()).toContain("/oauth2/tokenP")
      expect(fetchMock.mock.calls[1][0].toString()).toContain("/inquire-price")
      expect(fetchMock.mock.calls[2][0].toString()).toContain("/inquire-price")
    })

    it("KIS가 token 만료를 응답하면 token을 갱신하고 같은 요청을 한 번 재시도한다", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "expired-token",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "86400",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "1",
            msg_cd: "EGW00123",
            msg1: "기간이 만료된 token입니다",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "refreshed-token",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "86400",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output: {
              stck_prpr: "70000",
              stck_oprc: "69000",
              stck_hgpr: "71000",
              stck_lwpr: "68000",
              acml_vol: "1000",
              prdy_vrss: "500",
              prdy_ctrt: "0.72",
            },
          })
        )
      global.fetch = fetchMock

      await service.getCurrentPrice("005930", "J")

      expect(fetchMock).toHaveBeenCalledTimes(4)
      expect(fetchMock.mock.calls[0][0].toString()).toContain("/oauth2/tokenP")
      expect(fetchMock.mock.calls[1][0].toString()).toContain("/inquire-price")
      expect(fetchMock.mock.calls[2][0].toString()).toContain("/oauth2/tokenP")
      expect(fetchMock.mock.calls[3][0].toString()).toContain("/inquire-price")
      expect(
        (fetchMock.mock.calls[1][1]?.headers as Record<string, string>)
          .authorization
      ).toBe("Bearer expired-token")
      expect(
        (fetchMock.mock.calls[3][1]?.headers as Record<string, string>)
          .authorization
      ).toBe("Bearer refreshed-token")
    })
  })

  describe("KIS API failure", () => {
    it("KIS API가 제한 시간 안에 응답하지 않으면 BadGatewayException을 던진다", async () => {
      vi.useFakeTimers()

      const fetchMock = vi.fn<typeof fetch>(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("aborted")
              error.name = "AbortError"
              reject(error)
            })
          })
      )
      global.fetch = fetchMock

      const result = service.getCurrentPrice("005930", "J")
      const expectation =
        expect(result).rejects.toBeInstanceOf(BadGatewayException)

      await vi.advanceTimersByTimeAsync(5_000)

      await expectation
    })
  })

  describe("KIS request", () => {
    it("현재가 조회는 종목 코드와 market code로 요청한다", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "access-token-1",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "1",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output: {
              stck_prpr: "70000",
              stck_oprc: "69000",
              stck_hgpr: "71000",
              stck_lwpr: "68000",
              acml_vol: "1000",
              prdy_vrss: "500",
              prdy_ctrt: "0.72",
            },
          })
        )
      global.fetch = fetchMock

      await service.getCurrentPrice("005930", "J")

      const priceUrl = new URL(fetchMock.mock.calls[1][0].toString())
      const headers = fetchMock.mock.calls[1][1]?.headers as Record<
        string,
        string
      >

      expect(priceUrl.searchParams.get("FID_COND_MRKT_DIV_CODE")).toBe("J")
      expect(priceUrl.searchParams.get("FID_INPUT_ISCD")).toBe("005930")
      expect(headers.authorization).toBe("Bearer access-token-1")
      expect(headers.tr_id).toBe("FHKST01010100")
    })

    it("일봉 조회는 요청한 날짜 하루 범위로 조회한다", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "access-token-1",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "1",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output2: [
              {
                stck_bsop_date: "20260507",
                stck_oprc: "69000",
                stck_hgpr: "71000",
                stck_lwpr: "68000",
                stck_clpr: "70000",
                acml_vol: "1000",
              },
            ],
          })
        )
      global.fetch = fetchMock

      await service.getDailyPrice("005930", "2026-05-07", "J")

      const dailyUrl = new URL(fetchMock.mock.calls[1][0].toString())

      expect(dailyUrl.searchParams.get("FID_INPUT_DATE_1")).toBe("20260507")
      expect(dailyUrl.searchParams.get("FID_INPUT_DATE_2")).toBe("20260507")
      expect(dailyUrl.searchParams.get("FID_PERIOD_DIV_CODE")).toBe("D")
      expect(dailyUrl.searchParams.get("FID_ORG_ADJ_PRC")).toBe("0")
    })

    it("영업일 조회는 요청한 날짜를 기준일로 조회한다", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createJsonResponse({
            access_token: "access-token-1",
            access_token_token_expired: futureKisExpiry,
            token_type: "Bearer",
            expires_in: "1",
          })
        )
        .mockResolvedValueOnce(
          createJsonResponse({
            rt_cd: "0",
            msg_cd: "MCA00000",
            msg1: "정상처리 되었습니다.",
            output: [
              {
                bass_dt: "20260603",
                bzdy_yn: "Y",
                tr_day_yn: "Y",
                opnd_yn: "Y",
                sttl_day_yn: "Y",
              },
            ],
          })
        )
      global.fetch = fetchMock

      await service.getDomesticMarketDay("2026-06-03")

      const holidayUrl = new URL(fetchMock.mock.calls[1][0].toString())

      expect(holidayUrl.searchParams.get("BASS_DT")).toBe("20260603")
      expect(holidayUrl.searchParams.get("CTX_AREA_FK")).toBe("")
      expect(holidayUrl.searchParams.get("CTX_AREA_NK")).toBe("")
    })
  })
})
