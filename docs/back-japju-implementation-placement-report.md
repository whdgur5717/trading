# 잡주력 계산 백엔드 배치 보고서

## 1. 현재 back 구조 요약

현재 백엔드는 NestJS feature module 구조입니다.

| 영역                         | 현재 역할                                                       |
| ---------------------------- | --------------------------------------------------------------- |
| `stocks/`                    | 종목 검색, 종목 마스터 `stocks.json` 제공                       |
| `prices/`                    | 단일 종목 현재가 API                                            |
| `candles/`                   | 단일 종목 일봉 API                                              |
| `returns/`                   | 기존 서비스들을 조합한 수익률 계산 API                          |
| `market/`                    | 외부 시세 공급자를 감싸는 port/adaptor 계층. 현재 KIS 구현 존재 |
| `common/http/`               | 외부 HTTP 요청 공통 provider                                    |
| `common/api`, `common/error` | API 응답 래핑, 에러 매핑                                        |

중요한 구조:

| 현재 파일                             | 의미                                   |
| ------------------------------------- | -------------------------------------- |
| `back/src/app.module.ts`              | feature module을 앱에 등록             |
| `back/src/stocks/stocks.module.ts`    | `StocksService`와 종목 마스터 제공     |
| `back/src/market/data.module.ts`      | `MARKET_DATA_PORT`를 KIS 어댑터로 연결 |
| `back/src/market/port/data.ts`        | 현재가/일봉/거래일 port                |
| `back/src/market/adaptor/kis/*`       | KIS REST/WebSocket 구현                |
| `back/src/returns/returns.service.ts` | 여러 서비스 조합형 계산 로직 예시      |

## 2. 결론

잡주력 계산은 기존 `prices`, `candles`, `returns` 안에 넣지 않습니다.

새 feature module을 만듭니다.

```text
back/src/japju/
```

이유:

| 이유                                           | 설명                                                  |
| ---------------------------------------------- | ----------------------------------------------------- |
| `prices/`와 `candles/`는 단일 시세 조회 API    | 잡주력은 전종목 20거래일, 지수, 재무, 공시까지 조합함 |
| `returns/`는 과거 매수가 대비 현재 수익률 계산 | 잡주력은 위험/유동성/공시 점수 계산이라 성격이 다름   |
| `market/`는 외부 시세 어댑터 계층              | 사용자-facing 계산 API를 둘 위치가 아님               |
| 계산 로직이 큼                                 | controller/service/schema/calculation을 분리해야 함   |

## 3. 추천 모듈 배치

### 3.1 사용자 API

| 파일                                 | 역할                                                |
| ------------------------------------ | --------------------------------------------------- |
| `back/src/japju/japju.module.ts`     | 잡주력 feature module                               |
| `back/src/japju/japju.controller.ts` | `GET /japju-score?symbol=005930` 같은 HTTP endpoint |
| `back/src/japju/japju.dto.ts`        | OpenAPI용 DTO class                                 |
| `back/src/japju/japju.schema.ts`     | request/response zod schema                         |
| `back/src/japju/japju.service.ts`    | 전체 계산 orchestration                             |
| `back/src/japju/japju.errors.ts`     | 잡주력 계산 전용 에러 코드                          |

`AppModule`에는 `JapjuModule`을 추가합니다.

### 3.2 순수 계산 로직

계산 로직은 외부 API를 직접 호출하지 않는 pure function으로 분리합니다.

| 파일                                                 | 역할                                          |
| ---------------------------------------------------- | --------------------------------------------- |
| `back/src/japju/calculation/price-volatility.ts`     | 가격 급등락/장중 고저폭/급등락일 점수         |
| `back/src/japju/calculation/liquidity.ts`            | 거래대금, 거래량 급증, 회전율 점수            |
| `back/src/japju/calculation/market-size.ts`          | 시총 백분위, 대형주 cap 판단                  |
| `back/src/japju/calculation/market-sensitivity.ts`   | 종목 변동성 / 지수 변동성                     |
| `back/src/japju/calculation/status-flags.ts`         | 관리종목/거래정지/저유동성/시장경고 점수      |
| `back/src/japju/calculation/financial-disclosure.ts` | 적자, 자본잠식 후보, 부채비율, 공시 횟수 점수 |
| `back/src/japju/calculation/final-score.ts`          | 항목 합산, cap 적용, 판정 문구 선택           |

이 계산 파일들은 테스트하기 쉽게 만들어야 합니다.
외부 API 응답을 직접 받지 말고, 이미 정리된 입력 모델만 받습니다.

### 3.3 금융위원회 전종목/지수 API

금융위원회 API는 단일 종목 시세가 아니라 전종목/시장지수 스냅샷입니다.
기존 KIS `MarketDataPort`에 억지로 섞지 말고 `market` 아래 별도 port로 둡니다.

추천 위치:

```text
back/src/market/port/snapshot.ts
back/src/market/adaptor/public-data/snapshot.adaptor.ts
back/src/market/adaptor/public-data/schema.ts
back/src/market/adaptor/public-data/protocol.ts
back/src/market/adaptor/public-data/snapshot.module.ts
back/src/market/snapshot.module.ts
```

역할:

| 파일                                             | 역할                                            |
| ------------------------------------------------ | ----------------------------------------------- |
| `market/port/snapshot.ts`                        | 전종목 일별 시세, 일별 지수 조회 port           |
| `market/adaptor/public-data/protocol.ts`         | 금융위 endpoint, query 이름                     |
| `market/adaptor/public-data/schema.ts`           | 금융위 응답 zod 파싱                            |
| `market/adaptor/public-data/snapshot.adaptor.ts` | `getStockPriceInfo`, `getStockMarketIndex` 호출 |
| `market/snapshot.module.ts`                      | `MARKET_SNAPSHOT_PORT` export                   |

필요한 port 메서드:

| 메서드               | 내부 역할                       |
| -------------------- | ------------------------------- |
| `dailyStocks(date)`  | 특정 `basDt`의 전종목 시세 조회 |
| `dailyIndexes(date)` | 특정 `basDt`의 전체 지수 조회   |

`JapjuService`는 이 port를 사용해서 20거래일 데이터를 모읍니다.

### 3.4 OpenDART API

OpenDART는 시세가 아니라 기업 공시/재무입니다.
`market/`에 넣지 않고 별도 top-level module로 둡니다.

추천 위치:

```text
back/src/dart/
```

파일:

| 파일                                                   | 역할                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `back/src/dart/dart.module.ts`                         | DART module                                                   |
| `back/src/dart/port/disclosure.ts`                     | DART port                                                     |
| `back/src/dart/adaptor/opendart/protocol.ts`           | OpenDART endpoint 정의                                        |
| `back/src/dart/adaptor/opendart/schema.ts`             | OpenDART 응답 zod 파싱                                        |
| `back/src/dart/adaptor/opendart/disclosure.adaptor.ts` | `company`, `list`, `fnlttSinglAcnt`, `fnlttSinglAcntAll` 호출 |
| `back/src/dart/data/corp-codes.json`                   | `stockCode -> corpCode` 정적 매핑                             |
| `back/src/dart/corp-code.service.ts`                   | 정적 매핑 조회                                                |

현재 `back/src/stocks/data/dart-corp-codes.json`이 이미 있습니다.
장기적으로는 DART 소유 데이터이므로 `back/src/dart/data/corp-codes.json`으로 옮기는 편이 더 명확합니다.
다만 1차 구현에서 파일 이동이 부담이면 현재 위치를 읽는 `CorpCodeService`부터 만들고, 이후 이동해도 됩니다.

필요한 port 메서드:

| 메서드                               | 내부 역할                             |
| ------------------------------------ | ------------------------------------- |
| `company(corpCode)`                  | 업종, 설립일, 결산월 보조             |
| `disclosures(corpCode, period)`      | 최근 1년 정정/철회/주요사항 공시 계산 |
| `financialAccounts(corpCode, years)` | 적자, 자본잠식 후보, 부채비율 계산    |

### 3.5 캐시 위치

현재 `back`에는 DB나 Redis가 없습니다.
따라서 1차 구현은 프로세스 메모리 캐시로 시작하는 게 맞습니다.

추천 위치:

```text
back/src/japju/cache/market-snapshot-cache.ts
```

캐시 대상:

| 캐시 키                              | 값                 |
| ------------------------------------ | ------------------ |
| `stock-snapshot:YYYYMMDD`            | 금융위 전종목 시세 |
| `index-snapshot:YYYYMMDD`            | 금융위 전체 지수   |
| `dart-financial:corpCode:year`       | DART 재무제표 요약 |
| `dart-disclosure:corpCode:start:end` | DART 공시 목록     |

주의:

금융위 전종목 시세는 20거래일치가 필요하므로 매 요청마다 20번 이상 외부 호출하면 안 됩니다.
`JapjuService`에서 직접 캐시하지 말고, snapshot provider나 별도 cache service를 통해 재사용합니다.

## 4. 계산 흐름

`GET /japju-score?symbol=005930` 기준 흐름:

| 순서 | 모듈/서비스           | 처리                                                |
| ---: | --------------------- | --------------------------------------------------- |
|    1 | `JapjuController`     | query validation                                    |
|    2 | `JapjuService`        | `StocksService.getBySymbol(symbol)` 호출            |
|    3 | `StocksService`       | 종목 마스터에서 시장/상품/상태 플래그 반환          |
|    4 | `MarketSnapshotPort`  | 기준일부터 과거로 금융위 전종목 시세 20거래일 수집  |
|    5 | `MarketSnapshotPort`  | 같은 날짜의 코스피/코스닥 지수 수집                 |
|    6 | `CorpCodeService`     | `stockCode -> corpCode` 조회                        |
|    7 | `DartDisclosurePort`  | 재무제표/공시 조회                                  |
|    8 | `japju/calculation/*` | 항목별 점수 계산                                    |
|    9 | `final-score.ts`      | 합산, 대형주 cap, 판정 문구 선택                    |
|   10 | `JapjuController`     | 공통 interceptor가 `{ success: true, data }`로 응답 |

## 5. 기존 모듈에 넣으면 안 되는 것

| 넣지 말 위치          | 이유                                                            |
| --------------------- | --------------------------------------------------------------- |
| `prices/`             | 단일 현재가 조회 API라 전종목 백분위/재무공시 계산과 맞지 않음  |
| `candles/`            | 단일 일봉 API라 전종목 20거래일 캐시와 맞지 않음                |
| `returns/`            | 수익률 계산 도메인이라 잡주력 기준이 섞이면 책임이 깨짐         |
| `stocks/`             | 종목 검색/마스터 소유. 잡주력 계산 전체를 넣으면 비대해짐       |
| `market/adaptor/kis/` | KIS 전용 구현. 금융위/OpenDART 로직을 넣으면 어댑터 경계가 깨짐 |

## 6. 기존 모듈에서 재사용할 것

| 기존 모듈           | 재사용 방식                                              |
| ------------------- | -------------------------------------------------------- |
| `StocksModule`      | `StocksService.getBySymbol`, 종목 상태 플래그, 상품 유형 |
| `MarketDataModule`  | 필요 시 KIS 개별 종목 일봉/현재가 fallback               |
| `HttpRequestModule` | 금융위/OpenDART HTTP 호출 공통 provider                  |
| `common/api`        | Result 응답 래핑 유지                                    |
| `common/error`      | 새 에러 catalog를 추가해 공통 에러 응답 유지             |

## 7. 새 에러 코드 위치

새 파일:

```text
back/src/japju/japju.errors.ts
```

예상 에러:

| 에러 코드                         | 의미                               |
| --------------------------------- | ---------------------------------- |
| `japju-score-unavailable`         | 계산에 필요한 외부 데이터가 부족함 |
| `japju-score-invalid-market`      | 시장 구분이 계산 대상이 아님       |
| `japju-score-unsupported-product` | ETF/ETN 등 별도 계산 대상          |

`back/src/common/error/error-catalog.ts`에 `JAPJU_ERRORS`를 추가해야 합니다.

외부 API별 장애는 별도 port error로 감싸고, feature service에서는 잡주력 계산 에러로 변환합니다.

## 8. 테스트 위치

| 테스트                       | 위치                                            |
| ---------------------------- | ----------------------------------------------- |
| 항목별 점수 pure function    | `back/src/japju/calculation/*.spec.ts`          |
| `JapjuService` orchestration | `back/src/japju/japju.service.spec.ts`          |
| 금융위 adapter 응답 파싱     | `back/src/market/adaptor/public-data/*.spec.ts` |
| OpenDART adapter 응답 파싱   | `back/src/dart/adaptor/opendart/*.spec.ts`      |
| HTTP endpoint                | `back/test/e2e/japju.spec.ts`                   |

백엔드 지침상 테스트에서 실제 KIS를 호출하지 않습니다.
같은 원칙으로 금융위/OpenDART도 e2e에서는 MSW로 대체해야 합니다.

## 9. 구현 순서

| 순서 | 작업                                                                 |
| ---: | -------------------------------------------------------------------- |
|    1 | `market/port/snapshot.ts`와 금융위 public-data adapter 추가          |
|    2 | `dart/` module과 OpenDART adapter 추가                               |
|    3 | `japju/calculation/*` pure function 구현                             |
|    4 | `japju` feature module/controller/schema/service 추가                |
|    5 | `AppModule`에 `JapjuModule` 등록                                     |
|    6 | `env.validation.ts`에 `PUBLIC_DATA_SERVICE_KEY`, `DART_API_KEY` 추가 |
|    7 | unit/e2e 테스트 추가                                                 |
|    8 | OpenAPI 생성                                                         |

## 10. 첫 구현에서 제외할 것

| 제외 항목                     | 이유                                           |
| ----------------------------- | ---------------------------------------------- |
| 뉴스/테마 원인 판정           | 현재 확정 API만으로 불가                       |
| 섹터 전체 동반 급등 정밀 보정 | 별도 업종/섹터 데이터가 필요                   |
| DB/Redis 캐시                 | 현재 백엔드에 DB/Redis가 없으므로 1차에는 과함 |
| 실시간 시장경고 갱신          | 현재는 `stocks.json` 기준으로 시작             |
