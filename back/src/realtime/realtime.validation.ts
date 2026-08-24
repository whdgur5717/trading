import { err, ok, type Result } from "neverthrow"
import { z } from "zod"
import {
  commonErrors,
  type CommonInvalidRequestError,
} from "../common/error/common.errors"
import type { StockSymbol } from "../external/schema"

const requestedSymbolsSchema = z
  .string()
  .transform((value) => value.split(",").map((symbol) => symbol.trim()))
  .pipe(
    z.array(
      z.string().regex(/^\d{6}$/, "Each symbol must be a six-digit stock code")
    )
  )
  .transform((symbols) => [...new Set(symbols)])
  .pipe(z.array(z.string()).min(1).max(10))

export function parseRequestedSymbols(
  value: string
): Result<StockSymbol[], CommonInvalidRequestError> {
  const parsed = requestedSymbolsSchema.safeParse(value)
  if (parsed.success) {
    return ok(parsed.data)
  }

  return err(
    commonErrors.invalidRequest({
      issues: parsed.error.issues.map((issue) => ({
        path: ["symbols", ...issue.path],
        message: issue.message,
      })),
    })
  )
}
