import { z } from "zod"
import {
  DomesticStockChkHolidayResponse,
  DomesticStockInquireDailyItemChartPriceResponse,
  DomesticStockInquirePriceResponse,
} from "../../../../openapi/kis/rest/api"
import {
  candleSchema as portCandleSchema,
  priceSchema as portPriceSchema,
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

export const priceMapper = z
  .pipe(
    DomesticStockInquirePriceResponse,
    z.transform(({ output }) => ({
      currentPrice: Number(output.stck_prpr),
      openPrice: Number(output.stck_oprc),
      highPrice: Number(output.stck_hgpr),
      lowPrice: Number(output.stck_lwpr),
      volume: Number(output.acml_vol),
      changePrice: Number(output.prdy_vrss),
      changeRate: Number(output.prdy_ctrt),
    }))
  )
  .pipe(portPriceSchema)

export const candlesMapper = z
  .pipe(
    DomesticStockInquireDailyItemChartPriceResponse,
    z.transform(({ output2 }) =>
      output2
        .map((candle) => ({
          date: `${candle.stck_bsop_date.slice(0, 4)}-${candle.stck_bsop_date.slice(4, 6)}-${candle.stck_bsop_date.slice(6, 8)}`,
          openPrice: Number(candle.stck_oprc),
          highPrice: Number(candle.stck_hgpr),
          lowPrice: Number(candle.stck_lwpr),
          closePrice: Number(candle.stck_clpr),
          volume: Number(candle.acml_vol),
        }))
        .sort((left, right) => right.date.localeCompare(left.date))
    )
  )
  .pipe(z.array(portCandleSchema))

export const marketDayMapper = z.pipe(
  DomesticStockChkHolidayResponse,
  z.transform(({ output }) =>
    output.map((day) => ({
      date: `${day.bass_dt.slice(0, 4)}-${day.bass_dt.slice(4, 6)}-${day.bass_dt.slice(6, 8)}`,
      isBusinessDay: day.bzdy_yn === "Y",
      isTradingDay: day.tr_day_yn === "Y",
      isOpenDay: day.opnd_yn === "Y",
      isSettlementDay: day.sttl_day_yn === "Y",
    }))
  )
)

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
      businessDate: `${businessDate.data.slice(0, 4)}-${businessDate.data.slice(4, 6)}-${businessDate.data.slice(6, 8)}`,
    }
  })
  .pipe(tradeTickSchema.nullable())
