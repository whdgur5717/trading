# KIS OpenAPI 국내주식 시세

검증일: 2026-07-10

## REST 시장 구분값

| 값   | 의미 |
| ---- | ---- |
| `J`  | KRX  |
| `NX` | NXT  |
| `UN` | 통합 |

근거:

- KIS `주식현재가 시세` 문서의 `FID_COND_MRKT_DIV_CODE`
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Fuapi%2Fdomestic-stock%2Fv1%2Fquotations%2Finquire-price=>
- KIS `국내주식기간별시세(일/주/월/년)` 문서의 `FID_COND_MRKT_DIV_CODE`
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Fuapi%2Fdomestic-stock%2Fv1%2Fquotations%2Finquire-daily-itemchartprice=>

## REST: 주식현재가 시세

| 항목       | 값                                                 |
| ---------- | -------------------------------------------------- |
| API 이름   | 주식현재가 시세                                    |
| URL        | `/uapi/domestic-stock/v1/quotations/inquire-price` |
| Method     | `GET`                                              |
| 실전 TR ID | `FHKST01010100`                                    |
| 모의 TR ID | `FHKST01010100`                                    |

요청 파라미터:

| 파라미터                 | 의미                | 값                     |
| ------------------------ | ------------------- | ---------------------- |
| `FID_COND_MRKT_DIV_CODE` | 조건 시장 분류 코드 | `J`, `NX`, `UN`        |
| `FID_INPUT_ISCD`         | 입력 종목코드       | 종목코드, 예: `005930` |

응답 필드:

| 필드        | 의미        |
| ----------- | ----------- |
| `stck_prpr` | 주식 현재가 |
| `stck_oprc` | 주식 시가   |
| `stck_hgpr` | 주식 최고가 |
| `stck_lwpr` | 주식 최저가 |
| `acml_vol`  | 누적 거래량 |
| `prdy_vrss` | 전일 대비   |
| `prdy_ctrt` | 전일 대비율 |

근거:

- KIS API 문서:
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Fuapi%2Fdomestic-stock%2Fv1%2Fquotations%2Finquire-price=>
- KIS 공식 예제:
  <https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/inquire_price/inquire_price.py>

## REST: 국내주식기간별시세(일/주/월/년)

| 항목       | 값                                                                |
| ---------- | ----------------------------------------------------------------- |
| API 이름   | 국내주식기간별시세(일/주/월/년)                                   |
| URL        | `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice` |
| Method     | `GET`                                                             |
| 실전 TR ID | `FHKST03010100`                                                   |
| 모의 TR ID | `FHKST03010100`                                                   |

요청 파라미터:

| 파라미터                 | 의미                 | 값                     |
| ------------------------ | -------------------- | ---------------------- |
| `FID_COND_MRKT_DIV_CODE` | 조건 시장 분류 코드  | `J`, `NX`, `UN`        |
| `FID_INPUT_ISCD`         | 입력 종목코드        | 종목코드, 예: `005930` |
| `FID_INPUT_DATE_1`       | 입력 날짜 1          | 시작일, `YYYYMMDD`     |
| `FID_INPUT_DATE_2`       | 입력 날짜 2          | 종료일, `YYYYMMDD`     |
| `FID_PERIOD_DIV_CODE`    | 기간 분류 코드       | `D`, `W`, `M`, `Y`     |
| `FID_ORG_ADJ_PRC`        | 수정주가 원주가 가격 | `0`, `1`               |

공식 문서상 값:

| 파라미터              | 값  | 의미     |
| --------------------- | --- | -------- |
| `FID_PERIOD_DIV_CODE` | `D` | 일봉     |
| `FID_PERIOD_DIV_CODE` | `W` | 주봉     |
| `FID_PERIOD_DIV_CODE` | `M` | 월봉     |
| `FID_PERIOD_DIV_CODE` | `Y` | 년봉     |
| `FID_ORG_ADJ_PRC`     | `0` | 수정주가 |
| `FID_ORG_ADJ_PRC`     | `1` | 원주가   |

응답 필드:

| 필드             | 의미           |
| ---------------- | -------------- |
| `stck_bsop_date` | 주식 영업 일자 |
| `stck_oprc`      | 주식 시가      |
| `stck_hgpr`      | 주식 최고가    |
| `stck_lwpr`      | 주식 최저가    |
| `stck_clpr`      | 주식 종가      |
| `acml_vol`       | 누적 거래량    |

근거:

- KIS API 문서:
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Fuapi%2Fdomestic-stock%2Fv1%2Fquotations%2Finquire-daily-itemchartprice=>
- KIS 공식 예제:
  <https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/inquire_daily_itemchartprice/inquire_daily_itemchartprice.py>

## WebSocket: 국내주식 실시간체결가

| 시장 | API 이름                     | URL                  | 실전 TR ID | 모의 TR ID      |
| ---- | ---------------------------- | -------------------- | ---------- | --------------- |
| KRX  | 국내주식 실시간체결가 (KRX)  | `/tryitout/H0STCNT0` | `H0STCNT0` | `H0STCNT0`      |
| NXT  | 국내주식 실시간체결가 (NXT)  | `/tryitout/H0NXCNT0` | `H0NXCNT0` | 모의투자 미지원 |
| 통합 | 국내주식 실시간체결가 (통합) | `/tryitout/H0UNCNT0` | `H0UNCNT0` | 모의투자 미지원 |

요청 필드:

| 필드           | 의미          | 값                                 |
| -------------- | ------------- | ---------------------------------- |
| `approval_key` | 웹소켓 접속키 | `/oauth2/Approval` 발급값          |
| `custtype`     | 고객타입      | `B`, `P`                           |
| `tr_type`      | 거래타입      | `1`, `2`                           |
| `tr_id`        | 거래ID        | `H0STCNT0`, `H0NXCNT0`, `H0UNCNT0` |
| `tr_key`       | 구분값        | 종목코드, 예: `005930`             |

근거:

- KIS `국내주식 실시간체결가 (KRX)`:
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Ftryitout%2FH0STCNT0=>
- KIS `국내주식 실시간체결가 (NXT)`:
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Ftryitout%2FH0NXCNT0=>
- KIS `국내주식 실시간체결가 (통합)`:
  <https://apiportal.koreainvestment.com/apiservice-apiservice?%2Ftryitout%2FH0UNCNT0=>
- KIS API 문서 목록:
  <https://apiportal.koreainvestment.com/apiservice-category>

## NXT 거래시간

| 항목          | 값                                      |
| ------------- | --------------------------------------- |
| 전체 거래시간 | `08:00~20:00`                           |
| Pre           | `08:00~08:50`                           |
| Main          | `09:00:30~15:20`                        |
| After         | `15:40~20:00`                           |
| 투자대상 증권 | 코스피, 코스닥 상장주식 중 NXT 선정종목 |

근거:

- 한국투자증권 주식거래시장 안내:
  <https://m.koreainvestment.com/main/customer/tradetransfer/_static/TF04da010000.jsp>
