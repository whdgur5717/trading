# 외부 REST 계약과 mock 생성

## 입력 경계

- `openapi/{provider}/rest/openapi.json`: 외부 REST 계약만 작성한다. mock용
  `example`과 `examples`는 넣지 않는다.
- `openapi/{provider}/rest/overlay.yaml`: mock에서 사용할 고정 성공값, named
  scenario, `default` 오류 body를 작성한다. 반드시 같은 위치의
  `./openapi.json`을 확장한다.

`openapi/config.mjs`는 provider 디렉터리를 순회하고 두 입력을 함께 검증한다.
Overlay target이 원본 문서와 일치하지 않거나 operation별 `success` 또는 `default`
응답이 없으면 생성을 실패시킨다.

## 생성 흐름

```text
openapi.json
  └─ Orval Zod 생성 ─> generated/{provider}/rest/api.ts

openapi.json + overlay.yaml
  ├─ Overlay success ─> Orval ─> generated/{provider}/rest/api.msw.ts
  └─ named/default 응답 ───────> generated/{provider}/rest/api.scenarios.ts
```

`openapi` 디렉터리는 생성 입력과 설정만, `generated` 디렉터리는
생성된 TypeScript 코드만 소유한다. 백엔드 코드는 생성 결과를
`#generated/{provider}/rest/...`로 import한다.

- `api.ts`: Zod 4 Mini 요청·응답 스키마, 추론 타입, operation별
  method/path/request/responses 계약
- `api.msw.ts`: Orval이 생성한 MSW handler와 고정 기본 성공 응답
- `api.scenarios.ts`: operation별 named scenario와 `default` 오류 body

생성된 Orval 코드는 직접 수정하지 않는다. HTTP 클라이언트, 서비스 로직,
neverthrow 오류, 도메인 모델은 생성하지 않는다.

```sh
pnpm generate:contract
```

## mock 응답 선택

`openapiHandlers`는 생성된 `scenarios`와 Orval handler 배열을 받아 공통 선택
handler를 먼저, Orval handler를 그다음에 등록한다.

```text
선택 header 없음                   -> Orval의 고정 200 success
x-mock-scenario: <name>           -> 해당 operation의 named scenario status/body
x-mock-status: 400..599           -> 요청한 status + 해당 operation의 default body
```

존재하지 않는 scenario, 400~599가 아닌 status, 두 선택 header를 함께 보낸 요청은
공통 선택 handler가 처리하지 않는다. 따라서 해당 URL과 method의 Orval 기본 handler가
응답한다. OpenAPI에 없는 URL을 대신 처리하는 fallback handler는 두지 않는다.

새 operation이나 named scenario를 추가해도 provider별 handler에 조건문을 추가하지
않는다. `overlay.yaml`을 수정하고 다시 생성하면 공통 handler가 생성 manifest를
순회해 처리한다. 새 provider는 중앙 handler 목록에서 생성된 `scenarios`와 Orval
handler 배열을 `openapiHandlers`에 전달한다. 특정 테스트가 응답을 직접 바꿔야 할
때는 MSW의 `server.use`를 그대로 사용할 수 있다.

## 계약 확장 필드

응답 확장 필드 처리기는 `responseExtensions` Map에 등록한다. 현재
`x-success-schema`는 HTTP 200의 `oneOf` 또는 `anyOf` 중 성공 `$ref`를 지정하며
다음을 검증한다.

1. 확장값이 component schema를 가리키는가
2. 같은 응답의 `oneOf` 또는 `anyOf`가 직접 `$ref` 배열인가
3. 성공 `$ref`가 정확히 한 분기와 일치하는가

통과하면 생성 계약에 `success`와 나머지 `failures`를 기록한다.

## 검증

```sh
pnpm generate:contract
pnpm type-check
pnpm test:e2e
```

- 원본 `openapi.json`에는 mock example이 없어야 한다.
- Overlay의 모든 action이 적용되어야 한다.
- 모든 operation의 Overlay 성공값과 오류값은 생성된 TypeScript 타입을 만족해야
  한다.
- 기본 성공, named scenario, 임의의 400~599 상태가 실제 MSW 요청에서 선택되어야
  한다.
- 동일 입력으로 다시 생성했을 때 세 생성 파일이 같아야 한다.
