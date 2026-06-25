import type { ExternalServiceError } from "../../../common/error/externalService/error"
import {
  MARKET_DATA_ERRORS,
  type MarketDataProviderError,
} from "../../market-data.error"

export type KisMarketDataFailure = ExternalServiceError<
  "unavailable" | "auth-unavailable" | "timeout" | "invalid-response"
>

export function toMarketDataError(
  error: KisMarketDataFailure
): MarketDataProviderError {
  switch (error.code) {
    case "unavailable":
      return {
        type: "market-data-unavailable",
        message: MARKET_DATA_ERRORS["market-data-unavailable"].message,
        details: externalDetails(error),
      }
    case "auth-unavailable":
      return {
        type: "market-data-auth-unavailable",
        message: MARKET_DATA_ERRORS["market-data-auth-unavailable"].message,
        details: externalDetails(error),
      }
    case "timeout":
      return {
        type: "market-data-timeout",
        message: MARKET_DATA_ERRORS["market-data-timeout"].message,
        details: externalDetails(error),
      }
    case "invalid-response":
      return {
        type: "market-data-invalid-response",
        message: MARKET_DATA_ERRORS["market-data-invalid-response"].message,
        details: externalDetails(error),
      }
  }

  const exhaustive: never = error
  return exhaustive
}

function externalDetails(error: ExternalServiceError) {
  return {
    service: error.service,
    externalCode: error.code,
    upstreamEndpoint: error.endpoint ?? null,
    upstreamStatus: error.upstreamStatus ?? null,
    upstreamCode: error.upstreamCode ?? null,
  }
}
