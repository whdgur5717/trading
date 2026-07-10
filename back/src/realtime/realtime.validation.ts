import { err, ok, type Result } from "neverthrow"
import {
  commonErrors,
  type CommonInvalidRequestError,
} from "../common/error/common.errors"

const MAX_REALTIME_STOCK_CODES = 10
const STOCK_CODE_PATTERN = /^\d{6}$/

export function parseRealtimeSymbols(
  symbols: string
): Result<string[], CommonInvalidRequestError> {
  const segments = symbols.split(",").map((symbol) => symbol.trim())

  if (segments.some((symbol) => symbol.length === 0)) {
    return err(
      commonErrors.invalidRequest({
        issues: [
          {
            path: ["symbols"],
            message: "symbols must be comma-separated stock symbols",
          },
        ],
      })
    )
  }

  const invalidSymbol = segments.find(
    (symbol) => !STOCK_CODE_PATTERN.test(symbol)
  )

  if (invalidSymbol) {
    return err(
      commonErrors.invalidRequest({
        issues: [
          {
            path: ["symbols"],
            message: `Invalid stock symbol: ${invalidSymbol}`,
          },
        ],
      })
    )
  }

  const stockCodes = Array.from(new Set(segments))

  if (stockCodes.length > MAX_REALTIME_STOCK_CODES) {
    return err(
      commonErrors.invalidRequest({
        issues: [
          {
            path: ["symbols"],
            message: `symbols must include ${MAX_REALTIME_STOCK_CODES} or fewer stock symbols`,
          },
        ],
      })
    )
  }

  return ok(stockCodes)
}
