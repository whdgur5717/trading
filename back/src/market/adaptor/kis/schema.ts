import { z } from "zod"
import {
  candleSchema as portCandleSchema,
  marketDaySchema as portMarketDaySchema,
  priceSchema as portPriceSchema,
  type QuotationMarket,
} from "../../port/data"
import { feedFrameSchema, tradeTickSchema } from "../../port/realtime"

export const responseMetaSchema = z.object({
  rt_cd: z.string(),
  msg_cd: z.string().optional(),
  msg1: z.string().optional(),
})

export const accessTokenSchema = z.object({
  access_token: z.string().min(1),
  access_token_token_expired: z.string().optional(),
  expires_in: z.coerce.number().int().positive().optional(),
  token_type: z.string().optional(),
})

export const approvalKeySchema = z.object({
  approval_key: z.string().min(1),
})

export type AccessToken = z.output<typeof accessTokenSchema>
export type ApprovalKey = z.output<typeof approvalKeySchema>

const numberTextSchema = z.string().min(1).pipe(z.coerce.number())
const compactDateSchema = z.string().regex(/^\d{8}$/)

function tradingDate(value: string) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

const candleSchema = z
  .object({
    stck_bsop_date: compactDateSchema,
    stck_oprc: numberTextSchema,
    stck_hgpr: numberTextSchema,
    stck_lwpr: numberTextSchema,
    stck_clpr: numberTextSchema,
    acml_vol: numberTextSchema,
  })
  .transform((candle) => ({
    date: tradingDate(candle.stck_bsop_date),
    openPrice: candle.stck_oprc,
    highPrice: candle.stck_hgpr,
    lowPrice: candle.stck_lwpr,
    closePrice: candle.stck_clpr,
    volume: candle.acml_vol,
  }))
  .pipe(portCandleSchema)

const marketDayRowSchema = z.object({
  bass_dt: compactDateSchema,
  bzdy_yn: z.enum(["Y", "N"]),
  tr_day_yn: z.enum(["Y", "N"]),
  opnd_yn: z.enum(["Y", "N"]),
  sttl_day_yn: z.enum(["Y", "N"]),
})

export const priceSchema = z
  .object({
    output: z.object({
      stck_prpr: numberTextSchema,
      stck_oprc: numberTextSchema,
      stck_hgpr: numberTextSchema,
      stck_lwpr: numberTextSchema,
      acml_vol: numberTextSchema,
      prdy_vrss: numberTextSchema,
      prdy_ctrt: numberTextSchema,
    }),
  })
  .transform(({ output }) => ({
    currentPrice: output.stck_prpr,
    openPrice: output.stck_oprc,
    highPrice: output.stck_hgpr,
    lowPrice: output.stck_lwpr,
    volume: output.acml_vol,
    changePrice: output.prdy_vrss,
    changeRate: output.prdy_ctrt,
  }))
  .pipe(portPriceSchema)

export const candlesSchema = z
  .object({
    output2: z.array(candleSchema).optional(),
  })
  .transform(({ output2 }) =>
    (output2 ?? [])
      .slice()
      .sort((left, right) => right.date.localeCompare(left.date))
  )
  .pipe(z.array(portCandleSchema))

export function marketDaySchema(quotationMarket: QuotationMarket) {
  return z
    .object({
      output: z.array(marketDayRowSchema),
    })
    .transform(({ output }) =>
      output.map((day) => ({
        date: tradingDate(day.bass_dt),
        quotationMarket,
        isBusinessDay: day.bzdy_yn === "Y",
        isTradingDay: day.tr_day_yn === "Y",
        isOpenDay: day.opnd_yn === "Y",
        isSettlementDay: day.sttl_day_yn === "Y",
      }))
    )
    .pipe(z.array(portMarketDaySchema))
}

export const tradeFrameSchema = feedFrameSchema

export const tradeTickFrameSchema = z
  .string()
  .transform((raw) => {
    const parts = raw.split("|")

    if (parts.length < 4 || parts[0] !== "0") {
      return null
    }

    const trId = parts[1]
    const values = parts[3].split("^")
    const [stockCode, tradeTime, rawPrice] = values
    const rawBusinessDate = values[33]

    if (!trId || !stockCode || !tradeTime || !rawPrice || !rawBusinessDate) {
      return null
    }

    const price = numberTextSchema.safeParse(rawPrice)
    const businessDate = compactDateSchema.safeParse(rawBusinessDate)

    if (!price.success || !businessDate.success) {
      return null
    }

    return {
      stockCode,
      trId,
      tradeTime,
      price: price.data,
      businessDate: tradingDate(businessDate.data),
    }
  })
  .pipe(tradeTickSchema.nullable())
