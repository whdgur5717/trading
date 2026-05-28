import {
  mapDailyItemChartPrice,
  mapInquirePrice,
  parseRealtimeTradeMessage,
} from "./kis-mappers"
import { describe, expect, it } from "vitest"

describe("KIS response mappers", () => {
  it("maps inquire-price output into typed current price data", () => {
    expect(
      mapInquirePrice({
        rt_cd: "0",
        msg1: "정상처리 되었습니다.",
        output: {
          stck_prpr: "271500",
          stck_oprc: "272000",
          stck_hgpr: "277000",
          stck_lwpr: "260000",
          acml_vol: "41404687",
          prdy_vrss: "5500",
          prdy_ctrt: "2.07",
        },
      })
    ).toEqual({
      currentPrice: 271500,
      openPrice: 272000,
      highPrice: 277000,
      lowPrice: 260000,
      accumulatedVolume: 41404687,
      previousDayChange: 5500,
      previousDayChangeRate: 2.07,
    })
  })

  it("maps an empty daily output2 as a non-trading day", () => {
    expect(
      mapDailyItemChartPrice({
        rt_cd: "0",
        msg1: "정상처리 되었습니다.",
        output2: [],
      })
    ).toEqual({
      isTradingDay: false,
      candle: null,
    })
  })

  it("parses realtime pipe trade messages into current price events", () => {
    const raw = [
      "0",
      "H0STCNT0",
      "001",
      [
        "005930",
        "153001",
        "271500",
        "2",
        "5500",
        "2.07",
        "270000",
        "272000",
        "277000",
        "260000",
        "271500",
        "271000",
        "10",
        "41404687",
        "11101719159250",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "20260507",
      ].join("^"),
    ].join("|")

    expect(parseRealtimeTradeMessage(raw)).toEqual({
      stockCode: "005930",
      trId: "H0STCNT0",
      price: 271500,
      tradeTime: "153001",
      businessDate: "20260507",
    })
  })
})
