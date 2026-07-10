import { HttpService } from "@nestjs/axios"
import { AxiosError, AxiosHeaders } from "axios"
import { of, throwError } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { HttpRequestError, HttpRequestProvider } from "./httpRequest.provider"

describe("HttpRequestProvider", () => {
  it("요청별 HTTP status 성공 기준을 전달할 수 있다", async () => {
    const request = vi.fn().mockReturnValue(
      of({
        status: 204,
        statusText: "No Content",
        data: null,
      })
    )
    const httpService = Object.assign(new HttpService(), { request })
    const provider = new HttpRequestProvider(httpService)
    const validateStatus = (status: number) => status === 204

    await provider.request({
      method: "GET",
      url: "https://example.com",
      validateStatus,
    })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        validateStatus,
      })
    )
  })

  it("요청별 기준이 없으면 모든 HTTP status를 응답으로 받는 기존 동작을 유지한다", async () => {
    const request = vi.fn().mockReturnValue(
      of({
        status: 500,
        statusText: "Internal Server Error",
        data: { message: "upstream failed" },
      })
    )
    const httpService = Object.assign(new HttpService(), { request })
    const provider = new HttpRequestProvider(httpService)

    const response = await provider.request({
      method: "GET",
      url: "https://example.com",
    })
    const [{ validateStatus }] = request.mock.calls[0]

    expect(validateStatus?.(500)).toBe(true)
    expect(response.status).toBe(500)
  })

  it("HTTP status 기준에 실패한 Axios 오류를 공통 요청 오류로 감싼다", async () => {
    const error = new AxiosError(
      "Request failed with status code 500",
      AxiosError.ERR_BAD_RESPONSE,
      undefined,
      undefined,
      {
        status: 500,
        statusText: "Internal Server Error",
        data: { message: "upstream failed" },
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      }
    )
    const httpService = Object.assign(new HttpService(), {
      request: vi.fn().mockReturnValue(throwError(() => error)),
    })
    const provider = new HttpRequestProvider(httpService)

    const result = await provider
      .request({
        method: "GET",
        url: "https://example.com",
        validateStatus: (status) => status < 500,
      })
      .catch((error: unknown) => error)

    expect(result).toBeInstanceOf(HttpRequestError)
    expect(result).toMatchObject({
      kind: "response",
      code: AxiosError.ERR_BAD_RESPONSE,
      response: {
        status: 500,
        statusText: "Internal Server Error",
        data: { message: "upstream failed" },
      },
    })
  })

  it("시간 초과 Axios 오류를 공통 요청 오류로 감싼다", async () => {
    const error = new AxiosError("timeout exceeded", AxiosError.ETIMEDOUT)
    const httpService = Object.assign(new HttpService(), {
      request: vi.fn().mockReturnValue(throwError(() => error)),
    })
    const provider = new HttpRequestProvider(httpService)

    const result = await provider
      .request({
        method: "GET",
        url: "https://example.com",
      })
      .catch((error: unknown) => error)

    expect(result).toBeInstanceOf(HttpRequestError)
    expect(result).toMatchObject({
      kind: "timeout",
      code: AxiosError.ETIMEDOUT,
    })
  })
})
