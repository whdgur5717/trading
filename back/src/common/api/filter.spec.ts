import {
  type ArgumentsHost,
  HttpException,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import type { HttpAdapterHost } from "@nestjs/core"
import { afterEach, describe, expect, it, vi } from "vitest"
import { commonErrors } from "../error/common.errors"
import { ApiExceptionFilter } from "./filter"

function filterContext(headersSent = false) {
  const request = {
    method: "GET",
    path: "/prices",
  }
  const response = {
    locals: {
      requestId: "request-1",
      requestStartedAt: Date.now() - 10,
    },
  }
  const reply = vi.fn()
  const httpAdapter = {
    isHeadersSent: vi.fn(() => headersSent),
    reply,
  }
  const filter = new ApiExceptionFilter({
    httpAdapter,
  } as unknown as HttpAdapterHost)
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost

  return { filter, host, reply, response }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("API exception response", () => {
  it("정의된 오류를 기존 공개 계약으로 반환하고 상태에 맞게 기록한다", () => {
    const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {})
    const { filter, host, reply, response } = filterContext()
    const error = commonErrors.invalidRequest({ issues: [] })

    filter.catch(new HttpException(error, error.status), host)

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "request-1",
        statusCode: 400,
        errorType: "common.invalid_request",
      })
    )
    expect(reply).toHaveBeenCalledWith(
      response,
      {
        success: false,
        error: {
          type: "common.invalid_request",
          status: 400,
          message: "Validation failed",
          data: { issues: [] },
        },
      },
      400
    )
  })

  it("예상하지 못한 오류의 원인은 기록하고 공개 응답에서는 숨긴다", () => {
    const logError = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => {})
    const { filter, host, reply, response } = filterContext()
    const exception = new Error("database password leaked")

    filter.catch(exception, host)

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        exceptionName: "Error",
        exceptionMessage: "database password leaked",
        stack: expect.any(String),
      })
    )
    expect(reply).toHaveBeenCalledWith(
      response,
      {
        success: false,
        error: {
          type: "common.internal",
          status: 500,
          message: "Internal server error",
          data: {},
        },
      },
      500
    )
  })

  it("Nest가 만든 HTTP 예외의 상태를 내부 오류로 왜곡하지 않는다", () => {
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {})
    const { filter, host, reply, response } = filterContext()
    const exception = new NotFoundException("Cannot GET /missing")

    filter.catch(exception, host)

    expect(reply).toHaveBeenCalledWith(response, exception.getResponse(), 404)
  })

  it("응답이 시작된 뒤에도 오류를 기록하되 다시 응답하지 않는다", () => {
    const logError = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => {})
    const { filter, host, reply } = filterContext(true)

    filter.catch(new Error("Stream failure"), host)

    expect(logError).toHaveBeenCalledOnce()
    expect(reply).not.toHaveBeenCalled()
  })
})
