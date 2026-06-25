import { describe, expect, it } from "vitest"
import { MARKET_DATA_ERRORS } from "../../market-data.error"
import { toMarketDataError } from "./error"
import { dataFromResponse } from "./response"
import { accessTokenSchema } from "./schema"

describe("KIS response parsing", () => {
  it("returns invalid market data response when authorization payload is malformed", () => {
    const result = dataFromResponse(
      {
        status: 200,
        statusText: "OK",
        data: { unexpected: "payload" },
      },
      "/oauth2/tokenP",
      accessTokenSchema,
      "authorization"
    )

    expect(result.isErr()).toBe(true)

    if (result.isErr()) {
      expect(result.error.code).toBe("invalid-response")

      const marketError = toMarketDataError(result.error)

      expect(marketError).toEqual({
        type: "market-data-invalid-response",
        message: MARKET_DATA_ERRORS["market-data-invalid-response"].message,
        details: {
          service: "kis",
          externalCode: "invalid-response",
          upstreamEndpoint: "/oauth2/tokenP",
          upstreamStatus: 200,
          upstreamCode: null,
        },
      })
    }
  })
})
