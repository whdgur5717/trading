import { KisService } from "./kis.service"
import { BadGatewayException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { afterEach, describe, expect, it, vi } from "vitest"

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

function createCurrentPriceResponse() {
  return {
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
  }
}

function createDailyPriceResponse() {
  return {
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
  }
}

describe("KisService token handling", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.useRealTimers()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("deduplicates concurrent access token requests", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString()

      if (url.includes("/oauth2/tokenP")) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return createJsonResponse({
          access_token: "access-token-1",
          access_token_token_expired: futureKisExpiry,
          token_type: "Bearer",
          expires_in: "1",
        })
      }

      if (url.includes("/inquire-price")) {
        return createJsonResponse(createCurrentPriceResponse())
      }

      if (url.includes("/inquire-daily-itemchartprice")) {
        return createJsonResponse(createDailyPriceResponse())
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })
    global.fetch = fetchMock

    const service = new KisService(createConfig())

    await Promise.all([
      service.getCurrentPrice("005930", "J"),
      service.getDailyPrice("005930", "2026-05-07", "J"),
    ])

    expect(
      fetchMock.mock.calls.filter(([input]) =>
        input.toString().includes("/oauth2/tokenP")
      )
    ).toHaveLength(1)
  })

  it("uses access_token_token_expired before expires_in when caching tokens", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString()

      if (url.includes("/oauth2/tokenP")) {
        return createJsonResponse({
          access_token: "access-token-1",
          access_token_token_expired: futureKisExpiry,
          token_type: "Bearer",
          expires_in: "1",
        })
      }

      if (url.includes("/inquire-price")) {
        return createJsonResponse(createCurrentPriceResponse())
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })
    global.fetch = fetchMock

    const service = new KisService(createConfig())

    await service.getCurrentPrice("005930", "J")
    await service.getCurrentPrice("005930", "J")

    expect(
      fetchMock.mock.calls.filter(([input]) =>
        input.toString().includes("/oauth2/tokenP")
      )
    ).toHaveLength(1)
  })

  it("clears the cached token and retries once when KIS returns an auth failure", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString()

      if (url.includes("/oauth2/tokenP")) {
        const tokenCallCount = fetchMock.mock.calls.filter(([calledInput]) =>
          calledInput.toString().includes("/oauth2/tokenP")
        ).length

        return createJsonResponse({
          access_token:
            tokenCallCount === 1 ? "expired-token" : "refreshed-token",
          access_token_token_expired: futureKisExpiry,
          token_type: "Bearer",
          expires_in: "86400",
        })
      }

      if (url.includes("/inquire-price")) {
        const priceCallCount = fetchMock.mock.calls.filter(([calledInput]) =>
          calledInput.toString().includes("/inquire-price")
        ).length

        if (priceCallCount === 1) {
          return createJsonResponse({
            rt_cd: "1",
            msg_cd: "EGW00123",
            msg1: "기간이 만료된 token입니다",
          })
        }

        return createJsonResponse(createCurrentPriceResponse())
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })
    global.fetch = fetchMock

    const service = new KisService(createConfig())

    await service.getCurrentPrice("005930", "J")

    expect(
      fetchMock.mock.calls.filter(([input]) =>
        input.toString().includes("/oauth2/tokenP")
      )
    ).toHaveLength(2)
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        input.toString().includes("/inquire-price")
      )
    ).toHaveLength(2)

    const priceCalls = fetchMock.mock.calls.filter(([input]) =>
      input.toString().includes("/inquire-price")
    )
    expect(
      (priceCalls[0][1]?.headers as Record<string, string>).authorization
    ).toBe("Bearer expired-token")
    expect(
      (priceCalls[1][1]?.headers as Record<string, string>).authorization
    ).toBe("Bearer refreshed-token")
  })

  it("aborts KIS requests after the request timeout", async () => {
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

    const service = new KisService(createConfig())
    const result = service.getCurrentPrice("005930", "J")
    const expectation =
      expect(result).rejects.toBeInstanceOf(BadGatewayException)

    await vi.advanceTimersByTimeAsync(5_000)

    await expectation
  })
})
