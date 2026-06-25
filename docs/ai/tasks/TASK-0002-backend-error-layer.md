# TASK-0002: Backend Error Layer

Status: In Progress
Last updated: 2026-06-19

## Goal

백엔드가 외부로 내려보내는 에러 형태와 내부 생성 지점을 먼저 파악하고, 이후 더
체계적인 에러 처리 레이어를 설계할 기준을 만든다.

## Scope

- `back` 패키지의 공통 응답 경계, validation, API filter/interceptor 조사.
- 도메인별 공개 error code와 HTTP status 조사.
- KIS, FSC, OpenDART 외부 연동 실패가 `market-data-*` API 에러로 매핑되는 흐름
  조사.
- 프론트 generated API와 React Query 연결부에서 endpoint failure 타입을 유지하는
  구현 검증.

## Assumptions

- 이번 단계의 기준은 현재 코드와 생성된 OpenAPI 계약이다.
- 일반 HTTP API와 realtime SSE는 외부로 보이는 실패 전달 방식이 다르다.
- 프론트에서 요청 자체가 실패한 네트워크/timeout 계열 에러와 schema mismatch는
  기능 UI가 직접 도메인 분기하지 않는다. 해당 에러는 endpoint `Failure`로 위장하지
  않고, React Query `throwOnError` 정책으로 route-level error boundary 같은 공통
  경계에서 처리한다.

## Changes

- `front/src/queries/api.ts`에서 ky `beforeError`의 `ApiError` 변환을 제거하고,
  generated response parse 실패용 `ApiSchemaError`와 알 수 없는 status용
  `ApiUnexpectedStatusError`를 추가했다.
- OpenAPI client template은 `.parse(body)` 대신 `safeParse(body)`를 사용한다.
  parse 실패는 `Err<Failure>`가 아니라 `ApiSchemaError`로 throw하며 원본 body와
  zod error를 보존한다.
- `front/src/queries/getStock.ts`, `getStockHistory.ts`, `searchStocks.ts`는
  generated `ResultAsync<Success, Failure>`를 수동 `queryOptions` 안에서만
  `.match(success, failure => { throw failure })`로 React Query에 연결한다.
  화면 사용처에는 이 변환 코드가 드러나지 않는다.

## Verification

- `back/docs/openapi.json`에서 endpoint별 4xx/5xx error code enum을 확인했다.
- `pnpm --filter back test:e2e -- prices.spec.ts`를 실행했고 e2e 5개 파일, 8개
  테스트가 통과했다.
- ky `beforeError` 검증에서 `127.0.0.1:1` 요청은 `NetworkError`로 들어와
  `isHTTPError(error) === false` 분기를 탔고, `127.0.0.1:4000/stocks/999999`
  요청은 `HTTPError`로 들어와 `isHTTPError(error) === true` 분기를 탔다.
- `pnpm --filter front type-check`를 통과했다.
- 작업 범위 파일 대상 ESLint를 통과했다.
- 전체 `pnpm --filter front lint`는 현재 작업과 별개인
  `front/src/app/jobju/page.tsx`의 기존 미사용 import 경고에서 실패했다.
- 가상 사용처 컴파일 검증에서 실제 `getStockQueryOptions`,
  `getStockHistoryQueryOptions`, `searchStocksQueryOptions`의 `query.error.status`가
  endpoint별 failure status union으로 잡히는 것을 확인했다.
- React Query runtime 검증에서 `Err<Failure>` 변환 결과가
  `status: "error"`, `isError: true`, `error: failure`로 들어가고,
  `throwOnError`가 endpoint failure에는 `false`, 일반 `Error`에는 `true`를
  반환하는 것을 확인했다.

## Next

- 다음 단계는 각 화면에서 `query.isError` 안의 endpoint별 `Failure` UI를 필요한
  만큼 구체화하는 것이다.
- 전체 front lint를 다시 통과시키려면 별도 작업으로 `front/src/app/jobju/page.tsx`
  의 기존 unused import를 정리해야 한다.
