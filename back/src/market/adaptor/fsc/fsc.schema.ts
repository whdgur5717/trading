import { z } from "zod"
import {
  dailyMarketIndexSchema,
  dailyStockPriceSchema,
} from "../../market.schema"

const numberTextSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).replaceAll(",", "").trim())
  .transform((value) => (value.startsWith(".") ? `0${value}` : value))
  .transform((value) =>
    value.startsWith("-.") ? value.replace("-.", "-0.") : value
  )
  .transform((value) => Number(value))
  .pipe(z.number())

const optionalNumberTextSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return null
    }

    const normalized = String(value).replaceAll(",", "").trim()
    return normalized === "" ? null : normalized
  })
  .transform((value) => {
    if (value === null) {
      return null
    }

    if (value.startsWith(".")) {
      return `0${value}`
    }

    return value.startsWith("-.") ? value.replace("-.", "-0.") : value
  })
  .transform((value) => (value === null ? null : Number(value)))
  .pipe(z.number().nullable())

const compactDateSchema = z
  .string()
  .regex(/^\d{8}$/)
  .transform(
    (value) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  )

const fscHeaderSchema = z.object({
  resultCode: z.string(),
  resultMsg: z.string().optional(),
})

const stockRowSchema = z
  .object({
    basDt: compactDateSchema,
    srtnCd: z.string().min(1),
    isinCd: z.string().min(1).optional(),
    itmsNm: z.string().min(1),
    mrktCtg: z.string().min(1),
    clpr: numberTextSchema,
    fltRt: numberTextSchema,
    mkp: numberTextSchema,
    hipr: numberTextSchema,
    lopr: numberTextSchema,
    trqu: numberTextSchema,
    trPrc: numberTextSchema,
    lstgStCnt: numberTextSchema,
    mrktTotAmt: numberTextSchema,
  })
  .transform((row) => ({
    date: row.basDt,
    stockCode: row.srtnCd,
    isinCode: row.isinCd ?? null,
    stockName: row.itmsNm,
    market: row.mrktCtg,
    closePrice: row.clpr,
    dailyReturnPct: row.fltRt,
    openPrice: row.mkp,
    highPrice: row.hipr,
    lowPrice: row.lopr,
    volume: row.trqu,
    tradeValue: row.trPrc,
    listedShares: row.lstgStCnt,
    marketCap: row.mrktTotAmt,
  }))
  .pipe(dailyStockPriceSchema)

const indexRowSchema = z
  .object({
    basDt: compactDateSchema,
    idxNm: z.string().min(1),
    clpr: numberTextSchema,
    fltRt: numberTextSchema,
    trPrc: optionalNumberTextSchema,
    lstgMrktTotAmt: optionalNumberTextSchema,
  })
  .transform((row) => ({
    date: row.basDt,
    indexName: row.idxNm,
    closePrice: row.clpr,
    changeRate: row.fltRt,
    tradeValue: row.trPrc,
    marketCap: row.lstgMrktTotAmt,
  }))
  .pipe(dailyMarketIndexSchema)

function itemsItemArraySchema<TSchema extends z.ZodType>(itemSchema: TSchema) {
  return z
    .union([z.array(itemSchema), itemSchema, z.undefined()])
    .transform((item) => {
      if (!item) {
        return []
      }

      return Array.isArray(item) ? item : [item]
    })
}

function fscResponseSchema<TSchema extends z.ZodType>(itemSchema: TSchema) {
  return z.object({
    response: z.object({
      header: fscHeaderSchema,
      body: z.object({
        items: z
          .object({
            item: itemsItemArraySchema(itemSchema),
          })
          .optional(),
      }),
    }),
  })
}

export const fscStockPriceResponseSchema = fscResponseSchema(stockRowSchema)
export const fscMarketIndexResponseSchema = fscResponseSchema(indexRowSchema)
export const fscErrorHeaderSchema = z.object({
  response: z.object({
    header: fscHeaderSchema,
  }),
})
