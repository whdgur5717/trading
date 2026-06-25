import { describe, expect, it } from "vitest"
import { apiErrorBody } from "../api/response"
import { ApiError } from "./error"
import { apiErrorMapper } from "./mapper"

describe("error mapper", () => {
  it("passes through API errors", () => {
    const exception = new ApiError("invalid-request", {
      message: "Validation failed",
      details: [
        {
          code: "invalid_type",
          path: ["query"],
          message: "Invalid input",
        },
      ],
    })

    const error = apiErrorMapper.toApiError(exception)
    const body = apiErrorBody(error)

    expect(error).toBe(exception)
    expect(body.status).toBe(400)
    expect(error.code).toBe("invalid-request")
    expect(error.message).toBe("Validation failed")
    expect(error.details).toEqual([
      {
        code: "invalid_type",
        path: ["query"],
        message: "Invalid input",
      },
    ])
  })

  it("projects application errors into API errors", () => {
    const error = apiErrorMapper.toApiError({
      type: "unsupported-stock",
      message: "Unsupported stock symbol: 000000",
    })
    const body = apiErrorBody(error)

    expect(body.status).toBe(404)
    expect(error.code).toBe("unsupported-stock")
    expect(error.message).toBe("Unsupported stock symbol: 000000")
    expect(error.details).toBeUndefined()
  })

  it("hides unknown errors behind the internal server error response", () => {
    const error = apiErrorMapper.toApiError(
      new Error("database password leaked")
    )
    const body = apiErrorBody(error)

    expect(body.status).toBe(500)
    expect(error.code).toBe("internal-error")
    expect(error.message).toBe("Internal server error")
    expect(error.details).toBeUndefined()
  })
})
