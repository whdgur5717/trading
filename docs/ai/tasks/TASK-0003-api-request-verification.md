# TASK-0003: API Request Verification

Status: In Progress
Last updated: 2026-06-21

## Goal

front에서 보낼 것으로 예상한 API 요청이 실제로 어떤 경계를 지나 back 응답으로
돌아오는지 검증하는 방식을 정한다. back 내부의 외부 API 호출은 테스트에서 실제
운영 API로 나가지 않도록 mock 경계를 분리한다.

## Scope

- front generated client, queryOptions, `/api` proxy route 조사.
- back controller/service/adaptor 흐름과 외부 API 호출 지점 조사.
- 기존 front mock control, back e2e MSW, dev `start:mock`의 검증 범위 구분.

## Findings

- front browser 요청은 `/api`, server render 요청은 `${APP_ORIGIN}/api`를 사용하고,
  `front/src/app/api/[...path]/route.ts`가 `API_BASE_URL`로 프록시한다.
- front mock control은 `/api/mock/operations` 또는 override API가 호출될 때
  Next 서버 안에서 MSW를 켜고, `API_BASE_URL` 대상 요청을 OpenAPI 기반 mock
  응답으로 가로챈다. 이 방식은 back을 검증하지 않고 front 계약과 프록시 쪽
  응답 실험에 가깝다.
- back e2e는 실제 Nest 앱을 띄운 뒤 HTTP 요청을 보내고, KIS REST는
  `back/test/support/kis/http.ts`의 MSW handler로 대체한다.
- `/prices`, `/candles`, `/returns`, `/realtime`은 기존 KIS mock으로 테스트하기
  좋다.
- `/jobju/score`는 FSC와 OpenDART도 호출한다. 현재 `back/scripts/dev-mock.ts`와
  `back/test/support/kis/http.ts`는 KIS 중심이라, 이 endpoint를 외부 호출 없이
  검증하려면 FSC/OpenDART handler를 추가하거나 front mock으로 back을 우회해야
  한다.

## Verification

- `pnpm --filter back exec vitest run test/e2e/prices.spec.ts test/e2e/returns.spec.ts --fileParallelism=false`
  통과: 2 files, 3 tests.
- `pnpm --filter front exec vitest run src/queries/generated/returns.spec.ts src/queries/queryOptions.spec.ts`
  통과: 2 files, 9 tests.
- `curl http://127.0.0.1:4100/prices?symbol=005930`로 임시 back mock 서버의
  KIS-mocked `/prices` 응답을 확인했다.
- 기존 dev 서버 기준 `curl http://127.0.0.1:3000/api/prices?symbol=005930`가
  200 응답을 반환해 `front /api` proxy 경로가 동작함을 확인했다.

## Next

- 원하는 검증 레벨을 정한다.
  - front 요청 모양과 parsing만 검증: generated client/queryOptions spec.
  - back endpoint 응답까지 검증: back e2e와 MSW handler.
  - Next proxy 포함 검증: front dev 또는 route handler 테스트에서 `/api/...`
    호출.
- `/jobju/score`의 실패/무데이터 경로를 늘릴 때는 각 테스트에서 필요한
  provider code body로 MSW handler를 override한다.

## Target Architecture

- API test의 기본 단위는 controller/service 직접 호출이 아니라 테스트용 Nest
  application에 HTTP 요청을 넣고 status/body/header를 검증하는 e2e harness로 둔다.
- 테스트 app factory는 production bootstrap과 같은 global filter/interceptor/pipe를
  적용하되, env와 외부 dependency만 test profile로 고정한다.
- 외부 HTTP API는 provider mock이 아니라 fake upstream server 또는 MSW handler로
  대체해, 우리 백엔드가 외부로 보낸 method/path/query/header/body까지 검증한다.
- 외부 API test support는 `fixture/http` 같은 공용 창고로 몰지 않는다.
  `back/test/support/external/{kis,fsc,opendart}`처럼 provider별로 handler와
  provider 응답을 나눈다.
- provider 응답 body는 우리 기능 이름이나 테스트 시나리오 이름이 아니라 외부
  REST provider의 endpoint/status/provider-code 기준으로 관리한다. 예를 들어
  `/jobju/score` 테스트라도 FSC 응답은 FSC handler/response에, OpenDART 응답은
  OpenDART handler/response에 둔다.
- API contract test는 generated OpenAPI와 e2e 응답 shape가 어긋나지 않는지 별도
  command로 검증한다.
- front까지 포함한 검증은 back API test와 분리하고, smoke 수준에서 Next `/api`
  proxy가 test back을 바라보도록 띄워 확인한다.

## Testing To Build

- 내부 service/integration 테스트는 기존 `src/*/testing/*Testing.module.ts`
  패턴을 표준으로 삼는다. 테스트 파일마다 provider mock을 직접 만들지 않고,
  feature 경계별 testing module을 import해 실제 검증 대상과 fake 의존성을 명확히
  나눈다.
- `HttpRequestProvider` 경계를 대체하는 testing module을 추가해 FSC/OpenDART/KIS
  adaptor 단위 테스트에서 반복 provider setup을 없앤다.
- `MarketService` 하위 의존성을 대체할 FSC/OpenDART testing module을 추가해
  `MarketService` 자체를 integration 수준에서 검증한다.
- back API e2e는 실제 `AppModule` 흐름을 유지하고, KIS/FSC/OpenDART는 test
  support fake upstream으로만 대체한다.
- 외부로 나간 요청 모양까지 검증해야 하는 테스트는 해당 spec의 MSW resolver에서
  request URL을 직접 관찰하고 expect한다. 공용 handler에 모든 query 규칙을
  재구현하지 않는다.

## Changes

- `back/src/common/http/testing/httpRequestTesting.module.ts`를 추가했다.
  `HttpRequestProvider` token을 `HttpRequestProviderMock`으로 대체하는 testing
  module이며, 외부 HTTP adaptor 단위/integration 테스트에서 재사용한다.
- `FscAdaptor`와 `OpendartAdaptor` spec에서 테스트 파일 내부 provider mock 생성 대신
  `HttpRequestTestingModule`을 import하도록 정리했다.
- `back/test/support/external/server.ts`를 추가해 KIS/FSC/OpenDART outbound HTTP를
  하나의 MSW server로 가로채도록 했다.
- provider별 handler를 `back/test/support/external/kis`,
  `back/test/support/external/fsc`, `back/test/support/external/opendart`로 나눴다.
  FSC/OpenDART 호출이 필요한 back e2e에서 실제 외부 API로 나가지 않게 막는다.
- FSC/OpenDART 응답 생성 코드는 두지 않는다. Provider별
  `responses/<endpoint>/<http-status>/<provider-code>.json` 파일에는 provider
  response body만 둔다.
- 기본 FSC/OpenDART handler는 현재 adaptor가 호출하는 endpoint별 정상 provider
  response body JSON을 반환한다. 실패/무데이터 경로는 테스트가 필요한 spec에서
  provider code JSON을 골라 MSW handler override로 표현한다.
- 기존 `back/test/support/kis/http.ts`는 기존 테스트 import 경로를 유지하기 위한
  얇은 호환 파일로 바꿨다. 실제 server 소유권은 `support/external/server.ts`에
  있다.

## Verification

- `pnpm --filter back exec vitest run src/market/adaptor/fsc/fsc.adaptor.spec.ts src/market/adaptor/opendart/opendart.adaptor.spec.ts`
  통과: 2 files, 5 tests.
- `pnpm --filter back type-check` 통과.
- `pnpm --filter back exec eslint --fix src/common/http/testing/httpRequestTesting.module.ts src/market/adaptor/fsc/fsc.adaptor.spec.ts src/market/adaptor/opendart/opendart.adaptor.spec.ts --max-warnings 0`
  통과.
- `pnpm --filter back exec eslint --fix test/support/external/fsc/handlers.ts test/support/external/opendart/handlers.ts test/support/external/kis/handlers.ts test/support/external/handlers.ts test/support/external/server.ts --max-warnings 0`
  통과.
- `pnpm --filter back type-check` 통과.
- `pnpm --filter back type-check` 통과.
- 변경 파일 대상 ESLint 통과:
  `pnpm --filter back exec eslint --fix test/support/external/fsc/handlers.ts test/support/external/opendart/handlers.ts --max-warnings 0`.
