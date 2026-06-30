import { MARKET_DATA_ERRORS } from "../../market/market-data.error"
import { STOCK_ERRORS } from "../../stocks/stocks.errors"

export const COMMON_ERRORS = {
  "invalid-request": {
    message: "Invalid request",
    description:
      "The request query, path parameter, or body does not match the API contract.",
  },
  "internal-error": {
    message: "Internal server error",
    description: "The server failed before the request could be completed.",
  },
} as const

export const API_ERRORS = {
  ...COMMON_ERRORS,
  ...STOCK_ERRORS,
  ...MARKET_DATA_ERRORS,
} as const

export type ErrorCode = keyof typeof API_ERRORS
