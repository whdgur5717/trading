import { BadGatewayException } from "@nestjs/common"
import type { RealtimePriceEvent } from "../realtime/realtime.schema"
import type {
  CurrentPrice,
  DailyPriceResult,
  DomesticMarketDay,
  KisDailyItemChartPriceResponse,
  KisDomesticHolidayResponse,
  KisInquirePriceResponse,
} from "./kis.schema"

function toNumber(value: string | undefined, fieldName: string): number {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw new BadGatewayException(
      `KIS returned invalid number for ${fieldName}`
    )
  }

  return numberValue
}

export function mapInquirePrice(
  response: KisInquirePriceResponse
): CurrentPrice {
  const output = response.output

  if (!output) {
    throw new BadGatewayException(
      response.msg1 || "KIS current price response is missing output"
    )
  }

  return {
    currentPrice: toNumber(output.stck_prpr, "stck_prpr"),
    openPrice: toNumber(output.stck_oprc, "stck_oprc"),
    highPrice: toNumber(output.stck_hgpr, "stck_hgpr"),
    lowPrice: toNumber(output.stck_lwpr, "stck_lwpr"),
    accumulatedVolume: toNumber(output.acml_vol, "acml_vol"),
    previousDayChange: toNumber(output.prdy_vrss, "prdy_vrss"),
    previousDayChangeRate: toNumber(output.prdy_ctrt, "prdy_ctrt"),
  }
}

export function mapDailyItemChartPrice(
  response: KisDailyItemChartPriceResponse
): DailyPriceResult {
  const candle = response.output2?.[0]

  if (!candle) {
    return {
      isTradingDay: false,
      candle: null,
    }
  }

  return {
    isTradingDay: true,
    candle: {
      date: candle.stck_bsop_date || "",
      openPrice: toNumber(candle.stck_oprc, "stck_oprc"),
      highPrice: toNumber(candle.stck_hgpr, "stck_hgpr"),
      lowPrice: toNumber(candle.stck_lwpr, "stck_lwpr"),
      closePrice: toNumber(candle.stck_clpr, "stck_clpr"),
      accumulatedVolume: toNumber(candle.acml_vol, "acml_vol"),
    },
  }
}

export function mapLatestDailyClose(
  response: KisDailyItemChartPriceResponse
): DailyPriceResult {
  const candle = response.output2
    ?.filter((item) => item.stck_bsop_date)
    .slice()
    .sort((left, right) =>
      String(right.stck_bsop_date).localeCompare(String(left.stck_bsop_date))
    )[0]

  if (!candle) {
    return {
      isTradingDay: false,
      candle: null,
    }
  }

  return {
    isTradingDay: true,
    candle: {
      date: candle.stck_bsop_date || "",
      openPrice: toNumber(candle.stck_oprc, "stck_oprc"),
      highPrice: toNumber(candle.stck_hgpr, "stck_hgpr"),
      lowPrice: toNumber(candle.stck_lwpr, "stck_lwpr"),
      closePrice: toNumber(candle.stck_clpr, "stck_clpr"),
      accumulatedVolume: toNumber(candle.acml_vol, "acml_vol"),
    },
  }
}

export function mapDomesticHoliday(
  response: KisDomesticHolidayResponse,
  date: string
): DomesticMarketDay {
  const marketDay = response.output?.find((item) => item.bass_dt === date)

  if (!marketDay) {
    throw new BadGatewayException(
      response.msg1 || `KIS holiday response is missing ${date}`
    )
  }

  return {
    date,
    isBusinessDay: marketDay.bzdy_yn === "Y",
    isTradingDay: marketDay.tr_day_yn === "Y",
    isOpenDay: marketDay.opnd_yn === "Y",
    isSettlementDay: marketDay.sttl_day_yn === "Y",
  }
}

export function parseRealtimeTradeMessage(
  raw: string
): RealtimePriceEvent | null {
  const parts = raw.split("|")

  if (parts.length < 4 || parts[0] !== "0") {
    return null
  }

  const trId = parts[1]
  const values = parts[3].split("^")

  if (!trId || values.length < 3) {
    return null
  }

  return {
    trId,
    stockCode: values[0],
    tradeTime: values[1],
    price: toNumber(values[2], "STCK_PRPR"),
    businessDate: values[33] || "",
  }
}
