import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  Logger,
} from "@nestjs/common"
import { err, ok } from "neverthrow"
import { firstValueFrom, of } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { commonErrors } from "../error/common.errors"
import { ApiResponseInterceptor } from "./response"

function executionContext() {
  const request = {
    method: "GET",
    path: "/prices",
  }
  const response = {
    locals: {
      requestId: "request-1",
      requestStartedAt: Date.now(),
    },
    statusCode: 200,
  }

  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext,
  }
}

function callHandler(value: unknown): CallHandler {
  return {
    handle: () => of(value),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("API response", () => {
  it("정상 결과를 성공 응답으로 변환하고 요청 결과를 기록한다", async () => {
    const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {})
    const interceptor = new ApiResponseInterceptor()
    const { context } = executionContext()

    const result = await firstValueFrom(
      interceptor.intercept(context, callHandler(ok({ price: 1000 })))
    )

    expect(result).toEqual({
      success: true,
      data: { price: 1000 },
    })
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "request-1",
        method: "GET",
        path: "/prices",
        statusCode: 200,
        durationMs: expect.any(Number),
      })
    )
  })

  it("정의된 실패를 Nest HTTP 예외로 전달한다", async () => {
    const interceptor = new ApiResponseInterceptor()
    const { context } = executionContext()
    const error = commonErrors.invalidRequest({
      issues: [
        {
          code: "invalid_type",
          path: ["query"],
          message: "Invalid input",
        },
      ],
    })

    const exception = await firstValueFrom(
      interceptor.intercept(context, callHandler(err(error)))
    ).catch((caught: unknown) => caught)

    expect(exception).toBeInstanceOf(HttpException)
    expect((exception as HttpException).getStatus()).toBe(400)
    expect((exception as HttpException).getResponse()).toBe(error)
  })

  it("정의되지 않은 실패를 공개 오류로 위장하지 않는다", async () => {
    const interceptor = new ApiResponseInterceptor()
    const { context } = executionContext()
    const error = new Error("Unexpected failure")

    const exception = await firstValueFrom(
      interceptor.intercept(context, callHandler(err(error)))
    ).catch((caught: unknown) => caught)

    expect(exception).toBe(error)
  })
})
