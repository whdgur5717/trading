import { BadRequestException } from "@nestjs/common"

const MAX_REALTIME_STOCK_CODES = 10
const STOCK_CODE_PATTERN = /^\d{6}$/

export function normalizeRealtimeStockCodes(stockCodes: string): string[] {
  const segments = stockCodes.split(",").map((stockCode) => stockCode.trim())

  if (segments.some((stockCode) => stockCode.length === 0)) {
    throw new BadRequestException(
      "stockCodes must be comma-separated stock codes"
    )
  }

  const invalidStockCode = segments.find(
    (stockCode) => !STOCK_CODE_PATTERN.test(stockCode)
  )

  if (invalidStockCode) {
    throw new BadRequestException(`Invalid stock code: ${invalidStockCode}`)
  }

  const normalizedStockCodes = Array.from(new Set(segments))

  if (normalizedStockCodes.length > MAX_REALTIME_STOCK_CODES) {
    throw new BadRequestException(
      `stockCodes must include ${MAX_REALTIME_STOCK_CODES} or fewer stock codes`
    )
  }

  return normalizedStockCodes
}
