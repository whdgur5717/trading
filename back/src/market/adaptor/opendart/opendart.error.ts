import type { ExternalServiceError } from "../../../common/error/externalService/error"
import {
  MARKET_DATA_ERRORS,
  type MarketDataError,
} from "../../market-data.error"

export type OpendartResponseFailure = ExternalServiceError<
  "unavailable" | "auth-unavailable"
>
export type OpendartRequestFailure = ExternalServiceError<
  "unavailable" | "timeout"
>
export type OpendartFailure = ExternalServiceError<
  | "unavailable"
  | "auth-unavailable"
  | "timeout"
  | "invalid-response"
  | "not-found"
>

export function toOpendartMarketError(error: OpendartFailure): MarketDataError {
  switch (error.code) {
    case "auth-unavailable":
      return marketError("market-data-auth-unavailable", error)
    case "timeout":
      return marketError("market-data-timeout", error)
    case "invalid-response":
      return marketError("market-data-invalid-response", error)
    case "not-found":
      return marketError("market-data-not-found", error)
    case "unavailable":
      return marketError("market-data-unavailable", error)
  }

  const exhaustive: never = error
  return exhaustive
}

function marketError(
  type: MarketDataError["type"],
  error: OpendartFailure
): MarketDataError {
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
