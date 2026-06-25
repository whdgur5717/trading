import type { ExternalServiceError } from "../../../common/error/externalService/error"
import {
  MARKET_DATA_ERRORS,
  type MarketDataError,
} from "../../market-data.error"

export type FscResponseFailure = ExternalServiceError<
  "unavailable" | "auth-unavailable" | "invalid-response"
>
export type FscRequestFailure = ExternalServiceError<"unavailable" | "timeout">
export type FscFailure = FscResponseFailure | FscRequestFailure

export function toFscMarketError(error: FscFailure): MarketDataError {
  switch (error.code) {
    case "auth-unavailable":
      return marketError("market-data-auth-unavailable", error)
    case "timeout":
      return marketError("market-data-timeout", error)
    case "invalid-response":
      return marketError("market-data-invalid-response", error)
    case "unavailable":
      return marketError("market-data-unavailable", error)
  }

  const exhaustive: never = error
  return exhaustive
}

function marketError(type: MarketDataError["type"], error: FscFailure) {
  return {
    type,
    message: MARKET_DATA_ERRORS[type].message,
    details: {
      service: error.service,
      externalCode: error.code,
      upstreamEndpoint: error.endpoint ?? null,
      upstreamStatus: error.upstreamStatus ?? null,
      upstreamCode: error.upstreamCode ?? null,
    },
  }
}
