import { z } from "zod"

export const KIS_MARKET_CODES = ["J", "NX", "UN"] as const
export const kisMarketCodeSchema = z.enum(KIS_MARKET_CODES).meta({
  example: "J",
})

export const kisJsonObjectSchema = z.record(z.string(), z.unknown())

export const kisResponseMetaSchema = z.object({
  rt_cd: z.string(),
  msg_cd: z.string(),
  msg1: z.string(),
})

export const kisAccessTokenResponseSchema = z.strictObject({
  access_token: z.string(),
  access_token_token_expired: z.string(),
  token_type: z.string(),
  expires_in: z.coerce.number().int().positive(),
})

export const kisApprovalKeyResponseSchema = z.strictObject({
  approval_key: z.string(),
})

export const kisInquirePriceResponseSchema = z.object({
  rt_cd: z.string().optional(),
  msg_cd: z.string().optional(),
  msg1: z.string().optional(),
  output: z
    .object({
      stck_prpr: z.string().optional(),
      stck_oprc: z.string().optional(),
      stck_hgpr: z.string().optional(),
      stck_lwpr: z.string().optional(),
      acml_vol: z.string().optional(),
      prdy_vrss: z.string().optional(),
      prdy_ctrt: z.string().optional(),
    })
    .optional(),
})

export const currentPriceSchema = z.object({
  currentPrice: z.number().meta({ example: 78000 }),
  openPrice: z.number().meta({ example: 77500 }),
  highPrice: z.number().meta({ example: 78500 }),
  lowPrice: z.number().meta({ example: 77000 }),
  accumulatedVolume: z.number().meta({ example: 12345678 }),
  previousDayChange: z.number().meta({ example: 500 }),
  previousDayChangeRate: z.number().meta({ example: 0.65 }),
})

export const kisDailyItemChartPriceResponseSchema = z.object({
  rt_cd: z.string().optional(),
  msg_cd: z.string().optional(),
  msg1: z.string().optional(),
  output2: z
    .array(
      z.object({
        stck_bsop_date: z.string().optional(),
        stck_oprc: z.string().optional(),
        stck_hgpr: z.string().optional(),
        stck_lwpr: z.string().optional(),
        stck_clpr: z.string().optional(),
        acml_vol: z.string().optional(),
      })
    )
    .optional(),
})

export const kisDomesticHolidayResponseSchema = z.object({
  rt_cd: z.string().optional(),
  msg_cd: z.string().optional(),
  msg1: z.string().optional(),
  output: z
    .array(
      z.object({
        bass_dt: z.string().optional(),
        bzdy_yn: z.string().optional(),
        tr_day_yn: z.string().optional(),
        opnd_yn: z.string().optional(),
        sttl_day_yn: z.string().optional(),
      })
    )
    .optional(),
})

export const dailyCandleSchema = z.object({
  date: z.string().meta({ example: "20260515" }),
  openPrice: z.number().meta({ example: 77500 }),
  highPrice: z.number().meta({ example: 78500 }),
  lowPrice: z.number().meta({ example: 77000 }),
  closePrice: z.number().meta({ example: 78000 }),
  accumulatedVolume: z.number().meta({ example: 12345678 }),
})

export const dailyPriceResultSchema = z.object({
  isTradingDay: z.boolean().meta({ example: true }),
  candle: dailyCandleSchema.nullable(),
})

export const domesticMarketDaySchema = z.object({
  date: z.string().meta({ example: "20260603" }),
  isBusinessDay: z.boolean().meta({ example: true }),
  isTradingDay: z.boolean().meta({ example: true }),
  isOpenDay: z.boolean().meta({ example: true }),
  isSettlementDay: z.boolean().meta({ example: true }),
})

export type KisMarketCode = z.infer<typeof kisMarketCodeSchema>
export type KisAccessTokenResponse = z.infer<
  typeof kisAccessTokenResponseSchema
>
export type KisInquirePriceResponse = z.infer<
  typeof kisInquirePriceResponseSchema
>
export type CurrentPrice = z.infer<typeof currentPriceSchema>
export type KisDailyItemChartPriceResponse = z.infer<
  typeof kisDailyItemChartPriceResponseSchema
>
export type KisDomesticHolidayResponse = z.infer<
  typeof kisDomesticHolidayResponseSchema
>
export type DailyCandle = z.infer<typeof dailyCandleSchema>
export type DailyPriceResult = z.infer<typeof dailyPriceResultSchema>
export type DomesticMarketDay = z.infer<typeof domesticMarketDaySchema>
