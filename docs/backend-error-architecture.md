# 백엔드 오류 아키텍처

이 문서는 백엔드에서 예상 가능한 실패를 타입으로 다루고, 같은 실패 계약을
OpenAPI와 생성 클라이언트까지 전달하는 방식이다.

관련 결정은 `docs/adr/0002-public-api-error-contract.md`와
`docs/adr/0005-openapi-code-specific-error-schemas.md`에 둔다.

## 목표

- 예상 가능한 도메인 실패와 외부 연동 실패는 `throw`가 아니라 `neverthrow`의
  `Result` 또는 `ResultAsync`로 반환한다.
- `err()`에는 `defineErrors()`로 정의한 오류만 넣는다.
- 공개 HTTP 실패 응답은 항상
  `{ success: false, error: { type, status, message, data } }` 형태다.
- OpenAPI는 컨트롤러 반환 타입의 오류 유니온을 읽어서 endpoint별 실패 타입을
  생성한다.
- 프론트 생성 클라이언트는 OpenAPI의 실패 응답을 `Failure` 유니온으로 받는다.

## 공개 오류 객체

공개 오류 객체는 다음 네 필드만 가진다.

```ts
type DefinedError = {
  readonly type: string
  readonly status: number
  readonly message: string
  readonly data: unknown
}
```

각 필드의 책임은 고정되어 있다.

| 필드      | 의미                                          |
| --------- | --------------------------------------------- |
| `type`    | 클라이언트가 분기하는 프로젝트 소유 오류 타입 |
| `status`  | HTTP 응답 상태                                |
| `message` | 고정된 공개 메시지                            |
| `data`    | 공개해도 되는 구조화된 맥락                   |

`message`는 동적으로 바꾸지 않는다. 종목 코드, provider, upstream status 같은
맥락은 `data`에 넣는다. `data`는 공개 API 계약이므로 원본 예외, stack, secret,
외부 응답 원문을 넣지 않는다.

## 오류 정의

오류는 책임을 소유한 모듈의 `*.errors.ts` 파일에서 `defineErrors()`로 정의한다.

```ts
export const returnsErrors = defineErrors({
  buyPriceNotFound: {
    type: "returns.buy_price_not_found",
    status: 404,
    message: "Buy price was not found",
    description:
      "The requested buy date does not have the market data required to calculate returns.",
    data: z.object({
      symbol: z.string(),
      buyDate: z.string(),
    }),
  },
})
```

외부 interface나 port에서 모듈 대표 오류 타입이 필요할 때만
`ErrorOf<typeof returnsErrors>`로 뽑는다.

`defineErrors()`는 세 가지 역할을 한다.

- factory가 받은 `data`를 Zod schema로 파싱한다.
- 반환 객체에 내부 brand를 붙여 정의된 오류인지 판별할 수 있게 한다.
- OpenAPI 생성기가 조회하는 registry에 `type/status/message/dataSchema`를
  등록한다.

현재 공통 오류는 `back/src/common/error/common.errors.ts`에 있다.

| type                     | status | 용도                                         |
| ------------------------ | ------ | -------------------------------------------- |
| `common.invalid_request` | 400    | query, param, body 검증 실패                 |
| `common.internal`        | 500    | 정의되지 않은 throw/rejection 또는 raw error |

현재 도메인/연동 오류는 각 책임 모듈이 소유한다.

| 파일                                   | 소유 오류                                    |
| -------------------------------------- | -------------------------------------------- |
| `back/src/stocks/stocks.errors.ts`     | `stock.unsupported`                          |
| `back/src/market/market-data.error.ts` | `market.provider_*`, `market.data_not_found` |
| `back/src/returns/returns.errors.ts`   | `returns.buy_price_not_found`                |

Provider 구분은 오류 타입 이름에 넣지 않는다. 예를 들어 KIS timeout은
`kis.timeout`이 아니라 `market.provider_timeout`이고,
`data.provider: "kis"`로 표현한다.

## 오류 흐름

일반 HTTP API 흐름은 다음 순서다.

```text
module service
  -> Result/ResultAsync<Success, DefinedErrorUnion>
  -> ApiResponseInterceptor
  -> apiErrorBody()
  -> { success: false, error: { type, status, message, data } }
```

서비스는 정의된 오류 factory로 실패값을 만든다.

```ts
return err(returnsErrors.buyPriceNotFound({ symbol, buyDate }))
```

`ApiResponseInterceptor`는 컨트롤러 반환값이 `Result` 계열이면 성공과 실패를
분리한다. 실패면 `apiErrorBody()`가 HTTP status와 body를 만든다.

`apiErrorBody()`는 정의된 오류만 그대로 통과시킨다. 정의되지 않은 객체, 일반
`Error`, 예상하지 못한 throw/rejection은 모두 `common.internal`로 감싼다.

검증 실패는 `nestjs-zod` validation pipe에서
`common.invalid_request` 예외로 변환된다. 이 예외도 정의된 오류 brand를 가지므로
전역 filter에서 같은 공개 오류 응답으로 내려간다.

## 책임 경계

오류 타입을 어디에서 새로 정의할지는 의미를 소유한 책임 경계로 결정한다.

하위 계층의 오류가 현재 계층에서도 같은 의미라면 그대로 전달한다. `prices`와
`candles`는 종목 조회와 시장 데이터 조회를 조합할 뿐 새 실패 의미를 만들지
않는다. 따라서 `stock.*`와 `market.*`를 그대로 내려보낸다.

현재 계층에서 새 의미가 생기면 그 계층이 오류를 소유한다. `returns`는 매수일의
가격이 없어 수익률 계산을 할 수 없다는 새 의미를 만들기 때문에
`returns.buy_price_not_found`를 정의한다.

```text
stocks.getBySymbol()
  -> stock.unsupported

market.price()/market.candles()
  -> market.provider_timeout
  -> market.provider_unavailable
  -> market.provider_auth_unavailable
  -> market.provider_invalid_response
  -> market.data_not_found

prices.getPrice()
  -> stock.* 또는 market.* 그대로 전달

candles.getCandles()
  -> stock.* 또는 market.* 그대로 전달

returns.calculate()/returns.chart()
  -> stock.* 또는 market.* 그대로 전달
  -> returns.buy_price_not_found 새로 생성
```

## OpenAPI 생성

OpenAPI 생성은 오류 정의 registry와 컨트롤러 반환 타입을 함께 본다.

```text
controller return type
  -> Result/ResultAsync success type, error type 추출
  -> error type union의 `type` literal 추출
  -> defineErrors registry에서 type 조회
  -> status별 error response schema 생성
  -> packages/api-client/openapi.json
```

핵심 파일은 다음과 같다.

| 파일                                              | 역할                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `back/src/bootstrap/openapi/result-type.ts`       | `Result`/`ResultAsync`의 성공/오류 타입과 오류 `type` literal 추출           |
| `back/src/bootstrap/openapi/response-schema.ts`   | 오류 `type`을 registry에서 찾아 OpenAPI schema 생성                          |
| `back/src/bootstrap/openapi/error-definitions.ts` | OpenAPI 생성 시 모든 오류 정의를 registry에 등록하기 위한 side-effect import |

반환 타입에 있는 오류 `type`이 registry에 없으면 OpenAPI 생성은 실패한다. 상태
코드가 정의와 맞지 않아도 실패한다. 이는 오류가 코드에만 있고 OpenAPI와 생성
클라이언트에 반영되지 않는 상태를 막기 위한 규칙이다.

일반 HTTP API에는 수동 Swagger response annotation을 추가하지 않는다. 반환 타입과
오류 정의에서 자동으로 생성한다. SSE처럼 `SkipApiResponse()`를 쓰는 경로는 자동
응답 래핑 대상이 아니므로 필요한 OpenAPI annotation을 직접 둔다.

## 생성 클라이언트

`packages/api-client`는 OpenAPI JSON을 읽어 `front/src/queries/generated/*`를
만든다. 문서화된 실패 응답은 4xx와 5xx 모두 generated function의 `Failure`
유니온에 들어간다.

프론트 `ky` 인스턴스는 `throwHttpErrors: false`를 사용한다. 그래야 백엔드가
문서화한 500, 502, 504 응답도 throw가 아니라 생성 클라이언트의 schema parse를
거쳐 typed `err()`로 반환된다.

예를 들어 `/prices`의 실패 타입은 status 기준으로 다음 응답을 포함하고, body
안쪽의 `error.type`은 OpenAPI schema의 literal union으로 좁혀진다.

```ts
export type PricesControllerPriceFailure =
  | { status: 400; body: PricesControllerPriceResponse400 }
  | { status: 404; body: PricesControllerPriceResponse404 }
  | { status: 500; body: PricesControllerPriceResponse500 }
  | { status: 502; body: PricesControllerPriceResponse502 }
  | { status: 504; body: PricesControllerPriceResponse504 }
```

## 새 오류 추가 절차

1. 오류 의미를 소유하는 모듈을 정한다.
2. 같은 의미의 하위 오류가 이미 있으면 새 오류를 만들지 말고 그대로 전달한다.
3. 새 의미라면 해당 모듈의 `*.errors.ts`에 `defineErrors()` 항목을 추가한다.
4. `type`은 점 구분 네임스페이스를 쓴다. 예: `returns.buy_price_not_found`.
5. `status`와 고정 `message`를 정한다.
6. 공개 가능한 `data` schema를 Zod로 정의한다.
7. 서비스에서는 `err(moduleErrors.someError(data))`를 반환한다.
8. 컨트롤러 반환 타입이 이 오류를 포함하도록 `Result` 흐름을 유지한다.
9. `pnpm generate:openapi`와 `pnpm generate:api`를 실행한다.
10. `pnpm --filter back type-check`, `pnpm --filter back lint`,
    `pnpm --filter front type-check`, `pnpm --filter front lint`,
    `pnpm --filter @trading/api-client build`,
    `pnpm --filter @trading/api-client lint`를 확인한다.

## 금지 사항

- 예상 가능한 실패를 `throw new Error()`로 흐르게 만들지 않는다.
- `err({ type: "...", ... })`처럼 raw object를 직접 넣지 않는다.
- `message`를 호출 지점에서 동적으로 바꾸지 않는다.
- `data`에 원본 예외, stack, secret, 외부 응답 원문을 넣지 않는다.
- Provider 이름을 오류 타입 namespace로 만들지 않는다.
- generated OpenAPI JSON이나 프론트 generated client를 손으로 수정하지 않는다.
- 일반 HTTP API의 실패 응답을 수동 Swagger annotation으로 맞추지 않는다.
