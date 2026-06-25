import type { ApplicationError } from "../common/error/error"

export const MARKET_DATA_ERRORS = {
  "market-data-unavailable": {
    message: "Market data is unavailable",
    description:
      "The upstream market data provider could not complete the request.",
  },
  "market-data-auth-unavailable": {
    message: "Market data authorization is unavailable",
    description:
      "The upstream market data provider rejected or failed authorization.",
  },
  "market-data-timeout": {
    message: "Market data request timed out",
    description: "The upstream market data request exceeded its time limit.",
  },
  "market-data-invalid-response": {
    message: "Market data response is invalid",
    description:
      "The upstream market data provider returned a response that does not match the expected contract.",
  },
  "market-data-not-found": {
    message: "Market data was not found",
    description:
      "The requested market data point is required for this operation but was not available from the provider.",
  },
} as const

export type MarketDataErrorCode = keyof typeof MARKET_DATA_ERRORS
export type MarketDataProviderErrorCode = Exclude<
  MarketDataErrorCode,
  "market-data-not-found"
>
export type MarketDataProviderError =
  ApplicationError<MarketDataProviderErrorCode>
export type MarketDataError = ApplicationError<MarketDataErrorCode>
