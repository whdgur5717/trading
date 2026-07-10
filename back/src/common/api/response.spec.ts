import { describe, expect, it } from "vitest"
import { commonErrors } from "../error/common.errors"
import { apiErrorBody } from "./response"

describe("API error response", () => {
  it("passes through defined API errors", () => {
    const exception = commonErrors.invalidRequest({
      issues: [
        {
          code: "invalid_type",
          path: ["query"],
          message: "Invalid input",
        },
      ],
    })

    const body = apiErrorBody(exception)

    expect(body).toEqual({
      type: "common.invalid_request",
      status: 400,
      message: "Validation failed",
      data: {
        issues: [
          {
            code: "invalid_type",
            path: ["query"],
            message: "Invalid input",
          },
        ],
      },
    })
  })

  it("hides raw application-shaped objects behind internal errors", () => {
    const body = apiErrorBody({
      type: "stock.unsupported",
      status: 404,
      message: "Unsupported stock symbol",
      data: { symbol: "000000" },
    })

    expect(body).toEqual({
      type: "common.internal",
      status: 500,
      message: "Internal server error",
      data: {},
    })
  })

  it("hides unknown errors behind the internal server error response", () => {
    const body = apiErrorBody(new Error("database password leaked"))

    expect(body).toEqual({
      type: "common.internal",
      status: 500,
      message: "Internal server error",
      data: {},
    })
  })
})
