import { err, ok, type Result } from "neverthrow"
import type { ApplicationError } from "../common/error/error"

const MAX_REALTIME_STOCK_CODES = 10
const STOCK_CODE_PATTERN = /^\d{6}$/

export function parseRealtimeSymbols(
  symbols: string
): Result<string[], ApplicationError<"invalid-request">> {
  const segments = symbols.split(",").map((symbol) => symbol.trim())

  if (segments.some((symbol) => symbol.length === 0)) {
    return err({
      type: "invalid-request",
      message: "symbols must be comma-separated stock symbols",
    })
  }

  const invalidSymbol = segments.find(
    (symbol) => !STOCK_CODE_PATTERN.test(symbol)
  )

  if (invalidSymbol) {
    return err({
      type: "invalid-request",
      message: `Invalid stock symbol: ${invalidSymbol}`,
    })
  }

  const stockCodes = Array.from(new Set(segments))

  if (stockCodes.length > MAX_REALTIME_STOCK_CODES) {
    return err({
      type: "invalid-request",
      message: `symbols must include ${MAX_REALTIME_STOCK_CODES} or fewer stock symbols`,
    })
  }

  return ok(stockCodes)
}
