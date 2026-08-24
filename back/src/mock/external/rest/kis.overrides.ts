import {
  getDomesticStockChkHolidayMockHandler,
  getDomesticStockChkHolidayResponseMock,
  getDomesticStockInquireDailyItemChartPriceMockHandler,
  getDomesticStockInquireDailyItemChartPriceResponseMock,
} from "#generated/kis/rest/api.msw"

export const kisOverrides = [
  // 고정된 장 운영일 응답을 요청 날짜 기준으로 평일은 개장일, 주말은 휴장일인 응답으로 대체한다.
  getDomesticStockChkHolidayMockHandler(({ request }) => {
    const query = new URL(request.url).searchParams
    const date = query.get("BASS_DT")!
    const response = getDomesticStockChkHolidayResponseMock()
    const weekday = new Date(
      Date.UTC(
        Number(date.slice(0, 4)),
        Number(date.slice(4, 6)) - 1,
        Number(date.slice(6, 8))
      )
    ).getUTCDay()
    const tradingDay = weekday !== 0 && weekday !== 6 ? "Y" : "N"

    return {
      ...response,
      output: [
        {
          ...response.output[0],
          bass_dt: date,
          wday_dvsn_cd: String(weekday),
          bzdy_yn: tradingDay,
          tr_day_yn: tradingDay,
          opnd_yn: tradingDay,
          sttl_day_yn: tradingDay,
        },
      ],
    }
  }),
  // 고정된 일봉 응답을 요청한 조회 기간의 날짜별 시세 응답으로 대체한다.
  getDomesticStockInquireDailyItemChartPriceMockHandler(({ request }) => {
    const query = new URL(request.url).searchParams
    // KIS 일봉 조회 기간. 두 값 모두 YYYYMMDD 형식이다.
    const start = query.get("FID_INPUT_DATE_1")!
    const end = query.get("FID_INPUT_DATE_2")!
    // 날짜 계산을 UTC로 고정해 실행 환경의 시간대가 결과에 섞이지 않게 한다.
    const day = 86_400_000
    const startTime = Date.UTC(
      Number(start.slice(0, 4)),
      Number(start.slice(4, 6)) - 1,
      Number(start.slice(6, 8))
    )
    const endTime = Date.UTC(
      Number(end.slice(0, 4)),
      Number(end.slice(4, 6)) - 1,
      Number(end.slice(6, 8))
    )
    // Orval이 생성한 정상 응답을 뼈대로 사용하고 일봉 배열(output2)만 교체한다.
    const response = getDomesticStockInquireDailyItemChartPriceResponseMock()
    // output2는 최신 날짜부터 내려오는 일별 OHLCV 데이터다.
    // mock에서는 주말을 포함한 요청 범위의 모든 날짜를 최대 100개까지 만든다.
    const output2 = Array.from(
      {
        length: Math.min(
          100,
          Math.max(0, Math.floor((endTime - startTime) / day) + 1)
        ),
      },
      (_, index) => {
        // 실제 시세가 아닌 화면 확인용 랜덤 가격과 거래량이다.
        const closePrice = 60_000 + Math.floor(Math.random() * 40_001)

        return {
          ...response.output2[0],
          // 주식 영업 일자
          stck_bsop_date: new Date(endTime - index * day)
            .toISOString()
            .slice(0, 10)
            .replaceAll("-", ""),
          // 종가, 시가, 고가, 저가
          stck_clpr: String(closePrice),
          stck_oprc: String(closePrice - 100),
          stck_hgpr: String(closePrice + 200),
          stck_lwpr: String(closePrice - 200),
          // 누적 거래량
          acml_vol: String(1_000_000 + Math.floor(Math.random() * 9_000_001)),
        }
      }
    )

    return { ...response, output2 }
  }),
]
