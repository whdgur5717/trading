import { z } from "zod"
import {
  FscMarketIndexResponse,
  FscStockPriceResponse,
} from "#generated/fsc/rest/api"
import {
  dailyMarketIndexSchema,
  dailyStockPriceSchema,
} from "../../market.schema"

function numberText(value: string | number): number {
  const normalized = String(value).replaceAll(",", "").trim()

  if (normalized.startsWith("-.")) {
    return Number(normalized.replace("-.", "-0."))
  }

  return Number(normalized.startsWith(".") ? `0${normalized}` : normalized)
}

function optionalNumberText(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).replaceAll(",", "").trim()

  if (normalized === "") {
    return null
  }

  if (normalized.startsWith("-.")) {
    return Number(normalized.replace("-.", "-0."))
  }

  return Number(normalized.startsWith(".") ? `0${normalized}` : normalized)
}

export const fscStockPriceMapper = z
  .pipe(
    FscStockPriceResponse,
    z.transform(({ response }) => {
      const item = response.body.items?.item

      return (item ? (Array.isArray(item) ? item : [item]) : []).map((row) => ({
        date: `${row.basDt.slice(0, 4)}-${row.basDt.slice(4, 6)}-${row.basDt.slice(6, 8)}`,
        stockCode: row.srtnCd,
        isinCode: row.isinCd ?? null,
        stockName: row.itmsNm,
        market: row.mrktCtg,
        closePrice: numberText(row.clpr),
        dailyReturnPct: numberText(row.fltRt),
        openPrice: numberText(row.mkp),
        highPrice: numberText(row.hipr),
        lowPrice: numberText(row.lopr),
        volume: numberText(row.trqu),
        tradeValue: numberText(row.trPrc),
        listedShares: numberText(row.lstgStCnt),
        marketCap: numberText(row.mrktTotAmt),
      }))
    })
  )
  .pipe(z.array(dailyStockPriceSchema))

export const fscMarketIndexMapper = z
  .pipe(
    FscMarketIndexResponse,
    z.transform(({ response }) => {
      const item = response.body.items?.item

      return (item ? (Array.isArray(item) ? item : [item]) : []).map((row) => ({
        date: `${row.basDt.slice(0, 4)}-${row.basDt.slice(4, 6)}-${row.basDt.slice(6, 8)}`,
        indexName: row.idxNm,
        closePrice: numberText(row.clpr),
        changeRate: numberText(row.fltRt),
        tradeValue: optionalNumberText(row.trPrc),
        marketCap: optionalNumberText(row.lstgMrktTotAmt),
      }))
    })
  )
  .pipe(z.array(dailyMarketIndexSchema))
