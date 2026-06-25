import type { ApplicationError } from "../common/error/error"

export const STOCK_ERRORS = {
  "unsupported-stock": {
    message: "Unsupported stock symbol",
    description: "The requested stock symbol is not supported by this service.",
  },
} as const

export type StockErrorCode = keyof typeof STOCK_ERRORS
export type StockError = ApplicationError<StockErrorCode>
