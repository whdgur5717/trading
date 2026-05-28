# KIS OpenAPI 사용 현황

작성 기준: `back/src` 코드에서 실제로 KIS 서버로 전송하는 요청만 정리한다.

## 요약

| 용도               | KIS API                         | Transport | Method                        | Path / TR ID                                                                       | 코드 진입점                    |
| ------------------ | ------------------------------- | --------- | ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| REST 접근토큰 발급 | 접근토큰발급                    | REST      | `POST`                        | `/oauth2/tokenP`                                                                   | `KisService.getAccessToken()`  |
| 웹소켓 접속키 발급 | 웹소켓 접속키 발급              | REST      | `POST`                        | `/oauth2/Approval`                                                                 | `KisService.getApprovalKey()`  |
| 현재가 조회        | 주식현재가 시세                 | REST      | `GET`                         | `/uapi/domestic-stock/v1/quotations/inquire-price`, `FHKST01010100`                | `KisService.getCurrentPrice()` |
| 일봉 조회          | 국내주식기간별시세(일/주/월/년) | REST      | `GET`                         | `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`, `FHKST03010100` | `KisService.getDailyPrice()`   |
| 실시간 체결가 구독 | 국내주식 실시간체결가 (KRX)     | WebSocket | subscribe/unsubscribe message | `KIS_WS_URL`, `H0STCNT0`                                                           | `RealtimeService.stream()`     |

`KIS_REST_BASE_URL`과 `KIS_WS_URL`은 환경변수로 주입된다. 기본 시장코드는 `KIS_MARKET_CODE`이며 기본값은 `J`다. 실시간 TR ID는 `KIS_REALTIME_TR_ID`이며 기본값은 `H0STCNT0`다.

## 공통 인증/헤더

### 접근토큰발급

- KIS MCP 매핑: `auth/auth_token`
- 코드 위치: `back/src/kis/kis.service.ts`
- 요청: `POST ${KIS_REST_BASE_URL}/oauth2/tokenP`
- Body:

```json
{
  "grant_type": "client_credentials",
  "appkey": "APP_KEY",
  "appsecret": "APP_SECRET"
}
```

- 응답에서 사용하는 필드:
  - `access_token`
  - `access_token_token_expired`
  - `expires_in`
  - `token_type`
- 동작:
  - REST 시세 API 호출 전에 Bearer 토큰을 발급한다.
  - `access_token_token_expired`가 있으면 그 시각 1분 전까지 캐시한다.
  - 인증 실패로 판단되면 캐시를 비우고 REST 요청을 1회 재시도한다.

### 웹소켓 접속키 발급

- KIS MCP 매핑: `auth/auth_ws_token`
- 코드 위치: `back/src/kis/kis.service.ts`
- 요청: `POST ${KIS_REST_BASE_URL}/oauth2/Approval`
- Body:

```json
{
  "grant_type": "client_credentials",
  "appkey": "APP_KEY",
  "secretkey": "APP_SECRET"
}
```

- 응답에서 사용하는 필드:
  - `approval_key`
- 동작:
  - 실시간 웹소켓 연결 전에 접속키를 발급한다.
  - 코드에서는 23시간 동안 `approval_key`를 캐시한다.

### REST 시세 요청 공통 헤더

`KisService.getWithAccessToken()`은 현재가/일봉 REST 요청에 아래 헤더를 붙인다.

| Header          | 값                                |
| --------------- | --------------------------------- |
| `content-type`  | `application/json; charset=utf-8` |
| `authorization` | `Bearer ${accessToken}`           |
| `appkey`        | `APP_KEY`                         |
| `appsecret`     | `APP_SECRET`                      |
| `tr_id`         | API별 TR ID                       |
| `custtype`      | `P`                               |

## REST 시세 API

### 주식현재가 시세

- KIS MCP 매핑: `domestic_stock/inquire_price`
- KIS 분류: `[국내주식] 기본시세 > 주식현재가 시세`
- 코드 위치:
  - 상수: `back/src/kis/kis.constants.ts`
  - 호출: `back/src/kis/kis.service.ts`
  - 응답 매핑: `back/src/kis/kis-mappers.ts`
- 요청:
  - Method: `GET`
  - Path: `/uapi/domestic-stock/v1/quotations/inquire-price`
  - TR ID: `FHKST01010100`
- Query:

| Query                    | 값           | 설명                    |
| ------------------------ | ------------ | ----------------------- |
| `FID_COND_MRKT_DIV_CODE` | `marketCode` | `J`, `NX`, `UN` 중 하나 |
| `FID_INPUT_ISCD`         | `code`       | 종목코드                |

- 현재 코드에서 사용하는 응답 필드:

| KIS field   | 내부 필드               |
| ----------- | ----------------------- |
| `stck_prpr` | `currentPrice`          |
| `stck_oprc` | `openPrice`             |
| `stck_hgpr` | `highPrice`             |
| `stck_lwpr` | `lowPrice`              |
| `acml_vol`  | `accumulatedVolume`     |
| `prdy_vrss` | `previousDayChange`     |
| `prdy_ctrt` | `previousDayChangeRate` |

- 호출 흐름:
  - `GET /stocks/:code/current`에서 호출한다.
  - `ReturnsService.calculate()`에서 현재 수익률 계산용으로 호출한다.

### 국내주식기간별시세(일/주/월/년)

- KIS MCP 매핑: `domestic_stock/inquire_daily_itemchartprice`
- KIS 분류: `[국내주식] 기본시세 > 국내주식기간별시세(일/주/월/년)`
- 코드 위치:
  - 상수: `back/src/kis/kis.constants.ts`
  - 호출: `back/src/kis/kis.service.ts`
  - 응답 매핑: `back/src/kis/kis-mappers.ts`
- 요청:
  - Method: `GET`
  - Path: `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`
  - TR ID: `FHKST03010100`
- Query:

| Query                    | 값                  | 설명                    |
| ------------------------ | ------------------- | ----------------------- |
| `FID_COND_MRKT_DIV_CODE` | `marketCode`        | `J`, `NX`, `UN` 중 하나 |
| `FID_INPUT_ISCD`         | `code`              | 종목코드                |
| `FID_INPUT_DATE_1`       | `date`에서 `-` 제거 | 조회 시작일             |
| `FID_INPUT_DATE_2`       | `date`에서 `-` 제거 | 조회 종료일             |
| `FID_PERIOD_DIV_CODE`    | `D`                 | 일봉                    |
| `FID_ORG_ADJ_PRC`        | `0`                 | 수정주가                |

- 현재 코드에서 사용하는 응답 필드:

| KIS field                   | 내부 필드                  |
| --------------------------- | -------------------------- |
| `output2[0].stck_bsop_date` | `candle.date`              |
| `output2[0].stck_oprc`      | `candle.openPrice`         |
| `output2[0].stck_hgpr`      | `candle.highPrice`         |
| `output2[0].stck_lwpr`      | `candle.lowPrice`          |
| `output2[0].stck_clpr`      | `candle.closePrice`        |
| `output2[0].acml_vol`       | `candle.accumulatedVolume` |

- 호출 흐름:
  - `GET /stocks/:code/history?date=YYYY-MM-DD`에서 호출한다.
  - `ReturnsService.calculate()`에서 매수일 종가 조회용으로 호출한다.
  - 응답의 `output2[0]`만 사용하므로 현재 구현은 단일 날짜 조회로 쓰고 있다.

## WebSocket 실시간 API

### 국내주식 실시간체결가 (KRX)

- KIS MCP 매핑: `domestic_stock/ccnl_krx`
- KIS 분류: `[국내주식] 실시간시세 > 국내주식 실시간체결가(KRX)`
- 코드 위치:
  - 연결/구독: `back/src/realtime/realtime.service.ts`
  - KIS 메시지 생성: `back/src/kis/kis.service.ts`
  - 응답 파싱: `back/src/kis/kis-mappers.ts`
- 연결:
  - URL: `KIS_WS_URL`
  - 연결 전 `POST /oauth2/Approval`로 `approval_key`를 발급한다.
- 구독 메시지:

```json
{
  "header": {
    "approval_key": "approval_key",
    "custtype": "P",
    "tr_type": "1",
    "content-type": "utf-8"
  },
  "body": {
    "input": {
      "tr_id": "H0STCNT0",
      "tr_key": "005930"
    }
  }
}
```

- 구독 해제는 같은 메시지 구조에서 `tr_type`만 `2`로 보낸다.
- 현재 코드에서 파싱하는 실시간 응답:

KIS 실시간 체결 데이터는 `|`와 `^`로 구분되는 문자열로 들어온다. 현재 구현은 암호화 구분값이 `0`인 메시지만 가격 이벤트로 변환한다.

| 위치         | KIS 의미    | 내부 필드      |
| ------------ | ----------- | -------------- |
| `parts[1]`   | TR ID       | `trId`         |
| `values[0]`  | 종목코드    | `stockCode`    |
| `values[1]`  | 체결시간    | `tradeTime`    |
| `values[2]`  | 주식 현재가 | `price`        |
| `values[33]` | 영업일자    | `businessDate` |

- 호출 흐름:
  - `GET /realtime/stream?stockCodes=005930,000660` SSE 엔드포인트가 KIS WebSocket을 연다.
  - 활성 종목코드별로 구독 메시지를 보낸다.
  - 클라이언트 연결이 해제되어 더 이상 필요한 종목이 없으면 구독 해제 메시지를 보낸다.

## 사용하지 않는 KIS API

현재 `back/src` 기준으로는 아래 API 호출 코드가 없다.

- 접근토큰폐기: `/oauth2/revokeP`
- 국내주식 호가/예상체결
- 해외주식/선물/옵션 API
- 주문/계좌 API

`back/docs/kis/access-token-revoke.md` 문서는 존재하지만, 실제 서비스 코드에서 `/oauth2/revokeP`를 호출하지는 않는다.
