import { HttpStatus } from "@nestjs/common"
import type { ErrorCode } from "../error/error-catalog"

export const API_ERROR_STATUS: Record<ErrorCode, HttpStatus> = {
  "invalid-request": HttpStatus.BAD_REQUEST,
  "internal-error": HttpStatus.INTERNAL_SERVER_ERROR,
  "unsupported-stock": HttpStatus.NOT_FOUND,
  "market-data-unavailable": HttpStatus.BAD_GATEWAY,
  "market-data-auth-unavailable": HttpStatus.BAD_GATEWAY,
  "market-data-timeout": HttpStatus.GATEWAY_TIMEOUT,
  "market-data-invalid-response": HttpStatus.BAD_GATEWAY,
  "market-data-not-found": HttpStatus.NOT_FOUND,
  "jobju-score-unavailable": HttpStatus.BAD_GATEWAY,
  "jobju-unsupported-product": HttpStatus.UNPROCESSABLE_ENTITY,
  "jobju-invalid-market": HttpStatus.UNPROCESSABLE_ENTITY,
  "jobju-financial-data-unavailable": HttpStatus.BAD_GATEWAY,
}

export function apiStatusFor(code: ErrorCode): HttpStatus {
  return API_ERROR_STATUS[code]
}
