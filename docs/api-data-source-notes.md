# API Data Source Implementation Spec

잡주력 계산기 구현에 필요한 외부 데이터 호출 계약입니다.
문서 목적은 웹 재탐색 없이 `어떤 API/파일을 호출하고`, `어떤 필드를 파싱하고`, `계산에 어떻게 쓰는지` 바로 구현하는 것입니다.

실제 인증키는 기록하지 않습니다.

| Placeholder                 | 의미                       |
| --------------------------- | -------------------------- |
| `<PUBLIC_DATA_SERVICE_KEY>` | 공공데이터포털 일반 인증키 |
| `<DART_API_KEY>`            | OpenDART API 인증키        |
| `<KIS_ACCESS_TOKEN>`        | KIS OAuth access token     |
| `<KIS_APP_KEY>`             | KIS app key                |
| `<KIS_APP_SECRET>`          | KIS app secret             |

## 0. 데이터 흐름

```text
사용자 종목명 입력
-> KIS 종목정보 파일에서 종목 후보 검색
-> 선택 종목의 stock_code 확정
-> OpenDART 고유번호 파일에서 stock_code -> corp_code 매핑
-> 금융위원회 주식시세정보에서 종목/시장 전체 시세 수집
-> 금융위원회 지수시세정보에서 시장지수 수익률 수집
-> 잡주력 지표 계산
```

조인 키:

| 내부 키     | 데이터 소스별 필드                                         |
| ----------- | ---------------------------------------------------------- |
| `stockCode` | KIS `단축코드`, OpenDART `stock_code`, 금융위원회 `srtnCd` |
| `corpCode`  | OpenDART `corp_code`만 사용. KIS로 대체 불가               |
| `market`    | KIS 파일 종류 또는 금융위원회 `mrktCtg`                    |
| `isinCode`  | KIS `표준코드`, 금융위원회 `isinCd`                        |

공통 숫자 파싱:

```ts
function parseApiNumber(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const normalized = String(value).replaceAll(",", "").trim()
  if (normalized === "") return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}
```

주의:

- 종목코드는 항상 `string`으로 보관합니다. `005930` 앞자리 0이 사라지면 안 됩니다.
- 공공데이터포털 JSON은 Swagger상 number여도 실제 응답에서 숫자값이 string으로 내려옵니다.
- `fltRt`는 `-.24`처럼 앞자리 0이 생략될 수 있으므로 `Number()` 기반 파싱을 씁니다.

## 1. KIS 종목정보

### 1.1 역할

KIS는 종목 검색과 종목 상태 플래그용입니다.
OpenDART `corp_code`는 KIS에서 나오지 않으므로 KIS로 DART 고유번호 조회를 대체하지 않습니다.

KIS에서 확보할 값:

| 내부 필드                | KIS 원천 필드                        | 사용처                   |
| ------------------------ | ------------------------------------ | ------------------------ |
| `stockCode`              | `단축코드`                           | 종목 식별, 다른 API 조인 |
| `isinCode`               | `표준코드`                           | 보조 식별                |
| `stockName`              | `한글명`, `한글종목명`, `종목명`     | 검색/표시                |
| `market`                 | 파일 종류: KOSPI/KOSDAQ/KONEX        | 비교군 선택              |
| `isTradingHalted`        | `거래정지`, `거래정지 여부`          | 위험 플래그              |
| `isAdministrativeIssue`  | `관리종목`, `관리 종목 여부`         | 위험 플래그              |
| `marketWarningCode`      | `시장경고`, `시장 경고 구분 코드`    | 과열/주의 플래그         |
| `isUnfaithfulDisclosure` | `불성실공시`, `불성실 공시 여부`     | 공시 신뢰도 플래그       |
| `isLiquidationTrading`   | `정리매매`, `정리매매 여부`          | 상장폐지 직전 플래그     |
| `isShortTermOverheated`  | `단기과열`, `단기과열종목구분코드`   | 과열 플래그              |
| `listedDate`             | `상장일자`, `주식 상장 일자`         | 신규상장 보정            |
| `listedShares`           | `상장주수`, `상장 주수(천)`          | 회전율 보조              |
| `marketCapHint`          | `시가총액`, `전일기준 시가총액 (억)` | 소형주 판단 보조         |

### 1.2 종목정보 파일 호출

종목명 검색의 1차 소스입니다. 인증 없이 zip 파일을 받습니다.

| 시장   | URL                                                                     | 압축 내부 파일    | 인코딩  |
| ------ | ----------------------------------------------------------------------- | ----------------- | ------- |
| KOSPI  | `https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip`  | `kospi_code.mst`  | `cp949` |
| KOSDAQ | `https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip` | `kosdaq_code.mst` | `cp949` |
| KONEX  | `https://new.real.download.dws.co.kr/common/master/konex_code.mst.zip`  | `konex_code.mst`  | `cp949` |

호출:

```bash
curl -L 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip' \
  --output kospi_code.mst.zip
```

파싱 규칙:

1. zip 다운로드
2. `.mst` 파일 압축 해제
3. `cp949`로 읽기
4. KIS 공식 예제 `stocks_info/`의 고정폭 필드 폭으로 파싱
5. KOSPI/KOSDAQ/KONEX 파일명을 기준으로 `market` 부여

검증용 기준값:

| 파일   | 2026-06-18 확인 row 수 |
| ------ | ---------------------- |
| KOSPI  | `2545`                 |
| KOSDAQ | `1822`                 |
| KONEX  | `107`                  |

실패 처리:

| 조건                                      | 처리                     |
| ----------------------------------------- | ------------------------ |
| HTTP status가 `200`이 아님                | 다운로드 실패            |
| `Content-Type`이 `application/zip`이 아님 | 오류 HTML 가능성         |
| zip 해제 실패                             | 파일 손상 또는 오류 응답 |
| `cp949` 디코딩 실패                       | 파일 포맷 변경           |
| 필수 필드 없음                            | KIS master 포맷 변경     |

### 1.3 KIS REST 주식기본조회

이미 `stockCode`를 아는 상태에서 상세정보 검증용으로만 씁니다.
종목명 검색의 1차 소스로 쓰지 않습니다.

Endpoint:

```text
GET https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/search-stock-info
```

Headers:

| 이름            | 값                          |
| --------------- | --------------------------- |
| `authorization` | `Bearer <KIS_ACCESS_TOKEN>` |
| `appkey`        | `<KIS_APP_KEY>`             |
| `appsecret`     | `<KIS_APP_SECRET>`          |
| `tr_id`         | `CTPF1002R`                 |

Query:

| 이름           | 값       | 설명             |
| -------------- | -------- | ---------------- |
| `PRDT_TYPE_CD` | `300`    | 주식/ETF/ETN/ELW |
| `PDNO`         | `005930` | 6자리 종목코드   |

호출:

```bash
curl -G 'https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/search-stock-info' \
  -H 'authorization: Bearer <KIS_ACCESS_TOKEN>' \
  -H 'appkey: <KIS_APP_KEY>' \
  -H 'appsecret: <KIS_APP_SECRET>' \
  -H 'tr_id: CTPF1002R' \
  --data-urlencode 'PRDT_TYPE_CD=300' \
  --data-urlencode 'PDNO=005930'
```

사용 필드:

| 응답 필드             | 사용처          |
| --------------------- | --------------- |
| `pdno`                | 종목코드 검증   |
| `prdt_name`           | 종목명 검증     |
| `mket_id_cd`          | 시장 검증       |
| `scty_grp_id_cd`      | 상품군 필터     |
| `excg_dvsn_cd`        | 거래소 검증     |
| `lstg_stqt`           | 상장주수 보조   |
| `scts_mket_lstg_dt`   | KOSPI 상장일자  |
| `kosdaq_mket_lstg_dt` | KOSDAQ 상장일자 |
| `lstg_abol_dt`        | 상장폐지 여부   |
| `tr_stop_yn`          | 거래정지 여부   |
| `admn_item_yn`        | 관리종목 여부   |

실패 처리:

| 조건                         | 처리                                     |
| ---------------------------- | ---------------------------------------- |
| HTTP `401`/`403`             | access token/appkey/appsecret/tr_id 확인 |
| 응답 `rt_cd`가 성공값이 아님 | KIS API 에러                             |
| `output` 없음                | 빈 결과 또는 잘못된 `PDNO`               |

## 2. OpenDART 고유번호

### 2.1 역할

DART 재무제표/공시 API에 필요한 `corpCode`를 얻습니다.
KIS에는 `corp_code`가 없으므로 이 단계는 생략할 수 없습니다.

### 2.2 호출

Endpoint:

```text
GET https://opendart.fss.or.kr/api/corpCode.xml
```

Query:

| 이름        | 값               |
| ----------- | ---------------- |
| `crtfc_key` | `<DART_API_KEY>` |

호출:

```bash
curl -G 'https://opendart.fss.or.kr/api/corpCode.xml' \
  --data-urlencode 'crtfc_key=<DART_API_KEY>' \
  --output corpCode.zip
```

응답:

| 항목                | 값                                       |
| ------------------- | ---------------------------------------- |
| 포맷                | Zip binary                               |
| 실제 `Content-Type` | `application/x-msdownload;charset=UTF-8` |
| 내부 파일           | `CORPCODE.xml`                           |
| 인증 실패/오류      | zip이 아닌 XML/HTML 오류 응답 가능       |

검증 기준값:

| 항목          | 값                                                              |
| ------------- | --------------------------------------------------------------- |
| HTTP status   | `200`                                                           |
| zip 파일 크기 | 약 `3.6MB`                                                      |
| XML 파일 크기 | 약 `30MB`                                                       |
| XML row 수    | 약 `118,000`                                                    |
| 삼성전자 매핑 | `stock_code=005930`, `corp_code=00126380`, `corp_name=삼성전자` |

### 2.3 사용 필드

| XML 필드        | 내부 필드     | 사용처                         |
| --------------- | ------------- | ------------------------------ |
| `corp_code`     | `corpCode`    | DART 재무제표/공시 API 호출 키 |
| `corp_name`     | `corpName`    | 회사명 검증                    |
| `corp_eng_name` | `corpEngName` | 보조 표시                      |
| `stock_code`    | `stockCode`   | KIS/시세 데이터와 조인         |
| `modify_date`   | `modifyDate`  | 캐시 갱신 판단                 |

파싱 결과:

```ts
type DartCorpCodeMap = Map<
  string,
  {
    corpCode: string
    corpName: string
    stockCode: string
    modifyDate: string
  }
>
```

구현 규칙:

1. zip 다운로드
2. XML 파싱
3. `stock_code`가 빈 row는 상장주식 계산 대상에서 제외
4. `stock_code`를 key로 `corp_code` map 생성
5. 선택 종목 `stockCode`로 `corpCode` 조회

실패 처리:

| 조건                       | 처리                                     |
| -------------------------- | ---------------------------------------- |
| HTTP status가 `200`이 아님 | 요청 실패                                |
| zip 해제 실패              | DART 오류 응답 여부 확인                 |
| `stock_code` 매핑 없음     | DART 재무제표/공시 조회 불가 상태로 표시 |

## 3. 금융위원회 주식시세정보

### 3.1 역할

날짜별 종목 시세와 시장 전체 비교군을 얻습니다.
잡주력 계산의 가격 변동성, 거래대금, 회전율, 시가총액 백분위에 씁니다.

### 3.2 호출

Endpoint:

```text
GET https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo
```

Query:

| 이름         | 필수 | 값                          |
| ------------ | ---- | --------------------------- |
| `serviceKey` | Y    | `<PUBLIC_DATA_SERVICE_KEY>` |
| `resultType` | Y    | `json`                      |
| `basDt`      | Y    | `YYYYMMDD`                  |
| `numOfRows`  | Y    | 전종목 조회 시 `5000` 권장  |
| `pageNo`     | Y    | `1`부터 시작                |

전종목 호출:

```bash
curl -G 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo' \
  --data-urlencode 'serviceKey=<PUBLIC_DATA_SERVICE_KEY>' \
  --data-urlencode 'resultType=json' \
  --data-urlencode 'basDt=20240614' \
  --data-urlencode 'numOfRows=5000' \
  --data-urlencode 'pageNo=1'
```

정상 응답 조건:

| 경로                         | 정상값            |
| ---------------------------- | ----------------- |
| HTTP status                  | `200`             |
| `response.header.resultCode` | `00`              |
| `response.header.resultMsg`  | `NORMAL SERVICE.` |

### 3.3 사용 필드

| 응답 필드    | 내부 필드        | 사용처        |
| ------------ | ---------------- | ------------- |
| `basDt`      | `date`           | 시계열 날짜   |
| `srtnCd`     | `stockCode`      | 종목 조인     |
| `isinCd`     | `isinCode`       | 보조 식별     |
| `itmsNm`     | `stockName`      | 표시          |
| `mrktCtg`    | `market`         | 비교군 분리   |
| `clpr`       | `closePrice`     | 가격 시계열   |
| `fltRt`      | `dailyReturnPct` | 변동성 계산   |
| `mkp`        | `openPrice`      | 장중 움직임   |
| `hipr`       | `highPrice`      | 장중 변동폭   |
| `lopr`       | `lowPrice`       | 장중 변동폭   |
| `trqu`       | `volume`         | 거래량/회전율 |
| `trPrc`      | `tradeValue`     | 유동성 백분위 |
| `lstgStCnt`  | `listedShares`   | 회전율        |
| `mrktTotAmt` | `marketCap`      | 시총 백분위   |

### 3.4 계산

같은 시장 비교군:

```ts
sameMarketRows = rows.filter((row) => row.market === selected.market)
```

주요 지표:

| 지표                   | 계산                                        |
| ---------------------- | ------------------------------------------- |
| `stockVolatility`      | 최근 N거래일 `stddev(dailyReturnPct)`       |
| `intradayRangePct`     | `(highPrice - lowPrice) / closePrice * 100` |
| `turnoverPct`          | `volume / listedShares * 100`               |
| `tradeValuePercentile` | 같은 시장 내 `tradeValue` 백분위            |
| `marketCapPercentile`  | 같은 시장 내 `marketCap` 백분위             |

최근 N거래일 구성:

1. 캘린더를 역순으로 조회
2. 해당 `basDt`의 전종목 응답이 있으면 거래일로 채택
3. 휴장일/빈 응답은 건너뜀
4. N개 거래일이 모일 때까지 반복

실패 처리:

| 조건                      | 처리                                          |
| ------------------------- | --------------------------------------------- |
| HTTP `401`                | 인증키/활용신청 상태 확인                     |
| HTTP `403`                | `resultType=json` 누락 여부, 서비스 권한 확인 |
| HTTP `404`                | host/service/operation 경로 오타              |
| API `resultCode !== "00"` | API 레벨 에러                                 |
| `items.item` 없음         | 휴장일 또는 빈 결과                           |

## 4. 금융위원회 지수시세정보

### 4.1 역할

시장지수 등락률을 가져와 종목 변동성이 시장 대비 얼마나 큰지 계산합니다.

### 4.2 호출

Endpoint:

```text
GET https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex
```

Query:

| 이름         | 필수 | 값                          |
| ------------ | ---- | --------------------------- |
| `serviceKey` | Y    | `<PUBLIC_DATA_SERVICE_KEY>` |
| `resultType` | Y    | `json`                      |
| `basDt`      | Y    | `YYYYMMDD`                  |
| `numOfRows`  | Y    | `200` 권장                  |
| `pageNo`     | Y    | `1`                         |

호출:

```bash
curl -G 'https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex' \
  --data-urlencode 'serviceKey=<PUBLIC_DATA_SERVICE_KEY>' \
  --data-urlencode 'resultType=json' \
  --data-urlencode 'basDt=20240614' \
  --data-urlencode 'numOfRows=200' \
  --data-urlencode 'pageNo=1'
```

시장별 대표 지수:

| `market` | `idxNm`                                    |
| -------- | ------------------------------------------ |
| `KOSPI`  | `코스피`                                   |
| `KOSDAQ` | `코스닥`                                   |
| `KONEX`  | 대표 지수 미확인. 시장 대비 지수 계산 제외 |

구현 규칙:

1. `basDt` 전체 지수를 조회
2. `idxNm`이 `코스피` 또는 `코스닥`인 row를 로컬 필터링
3. 영문 `KOSPI`, `KOSDAQ` exact query를 쓰지 않음

### 4.3 사용 필드

| 응답 필드        | 내부 필드         | 사용처             |
| ---------------- | ----------------- | ------------------ |
| `basDt`          | `date`            | 날짜 매칭          |
| `idxCsf`         | `indexCategory`   | 보조 분류          |
| `idxNm`          | `indexName`       | 대표 지수 선택     |
| `clpr`           | `indexClose`      | 지수 시계열        |
| `fltRt`          | `indexReturnPct`  | 시장 변동성        |
| `trPrc`          | `indexTradeValue` | 시장 거래대금 보조 |
| `lstgMrktTotAmt` | `indexMarketCap`  | 시장 규모 보조     |

### 4.4 계산

```ts
marketSensitivity = stockVolatility / indexVolatility
```

| 지표                | 계산                                            |
| ------------------- | ----------------------------------------------- |
| `indexVolatility`   | 최근 N거래일 대표 지수 `stddev(indexReturnPct)` |
| `marketSensitivity` | `stockVolatility / indexVolatility`             |

실패 처리:

| 조건                      | 처리                                          |
| ------------------------- | --------------------------------------------- |
| HTTP `401`                | 인증키 무효                                   |
| HTTP `403`                | `resultType=json` 누락 여부, 서비스 권한 확인 |
| API `resultCode !== "00"` | API 레벨 에러                                 |
| 대표 `idxNm` 없음         | 시장 대비 지수 계산 제외                      |

## 5. 잡주력 계산 입력 모델

각 소스 파싱 후 계산 모듈에는 아래 형태로 넘깁니다.

```ts
type StockIdentity = {
  stockCode: string
  corpCode: string | null
  stockName: string
  market: "KOSPI" | "KOSDAQ" | "KONEX"
  isinCode: string | null
}

type StockStatusFlags = {
  isTradingHalted: boolean
  isAdministrativeIssue: boolean
  isUnfaithfulDisclosure: boolean
  isLiquidationTrading: boolean
  isShortTermOverheated: boolean
  marketWarningCode: string | null
}

type DailyStockQuote = {
  date: string
  stockCode: string
  market: string
  closePrice: number
  dailyReturnPct: number
  openPrice: number
  highPrice: number
  lowPrice: number
  volume: number
  tradeValue: number
  listedShares: number
  marketCap: number
}

type DailyMarketIndex = {
  date: string
  market: "KOSPI" | "KOSDAQ"
  indexName: "코스피" | "코스닥"
  indexReturnPct: number
}
```

계산 모듈에서 직접 쓰는 값:

| 계산 항목                     | 필요한 소스                                 |
| ----------------------------- | ------------------------------------------- |
| 종목 검색/시장 확정           | KIS 종목정보 파일                           |
| DART 공시/재무제표 호출       | OpenDART `corp_code`                        |
| 최근 N거래일 변동성           | 금융위원회 주식시세정보 `fltRt`             |
| 시장 내 변동성 순위           | 금융위원회 주식시세정보 전종목 `fltRt`      |
| 거래대금 얇음                 | 금융위원회 주식시세정보 `trPrc`             |
| 회전율                        | 금융위원회 주식시세정보 `trqu`, `lstgStCnt` |
| 시총 규모                     | 금융위원회 주식시세정보 `mrktTotAmt`        |
| 시장 대비 과민반응            | 금융위원회 지수시세정보 `fltRt`             |
| 관리종목/거래정지/공시 리스크 | KIS 종목정보 파일 또는 KIS REST             |
