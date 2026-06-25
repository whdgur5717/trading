# Decision: Frontend Request Error Policy

Date: 2026-06-19
Status: Accepted

## Context

백엔드는 일반 HTTP API 실패를 `{ success: false, error: { status, code, message,
details? } }` 형태로 내려보낸다. ky의 `throwHttpErrors: true` 경로에서는 HTTP
실패 응답이 `HTTPError`가 되고, `error.data`에 이 body가 들어간다.

반대로 네트워크 끊김, 연결 거부, timeout처럼 요청 자체가 성립하지 않은 경우에는
백엔드 API error body가 없다. ky `beforeError`에는 `NetworkError`나
`TimeoutError` 같은 원본 `Error` 계열이 들어오며, `isHTTPError(error)`가
`false`다.

## Decision

프론트 기능 UI는 API 응답이 있는 endpoint failure만 직접 다룬다. Generated API는
`ResultAsync<Success, Failure>`를 유지하고, 수동 `queryOptions` 레이어에서만
`Err<Failure>`를 throw로 바꿔 React Query의 `query.isError/query.error`로
연결한다.

- `Failure`: OpenAPI endpoint별 4xx/5xx 실패 union이다. 화면 맥락에서 필요한
  경우 `query.error.status`와 `query.error.body.error.code` 기준으로 분기한다.
- `ApiSchemaError`, `ApiUnexpectedStatusError`, `NetworkError`, `TimeoutError`,
  기타 원본 `Error`: endpoint failure가 아니다. 기능 UI가 개별 분기하지 않고
  React Query `throwOnError` 정책으로 route-level error boundary 같은 공통
  경계로 보낸다.

## Consequences

- 기능 화면마다 네트워크/timeout 분기를 반복하지 않는다.
- 도메인별 UX는 백엔드 error code가 있는 endpoint `Failure`에만 둔다.
- 요청 자체 실패는 로깅/관측에는 원본 error를 남기되, 사용자에게는 공통 장애
  메시지나 toast로 처리한다.
- 사용처 화면에는 `match`, `Promise.reject`, `new ApiError`, `instanceof`,
  `isApiError`를 두지 않는다.

## Verification

- `api.get("http://127.0.0.1:1/stocks/005930")` 검증에서 ky `beforeError`가
  실행되고, `error.constructor.name`은 `NetworkError`,
  `isHTTPError(error)`는 `false`였다.
- `api.get("http://127.0.0.1:4000/stocks/999999")` 검증에서 ky `beforeError`가
  실행되고, `error.constructor.name`은 `HTTPError`, `isHTTPError(error)`는
  `true`였으며, `error.data`에 백엔드 실패 body가 있었다.
- `neverthrow@8.2.0`과 `@tanstack/react-query@5.100.9` 런타임 검증에서
  `Err<Failure>`를 그대로 반환하면 React Query가 success/data로 보고,
  `match(..., failure => { throw failure })`로 변환하면 `query.isError === true`,
  `query.error === failure`가 되는 것을 확인했다.
- 가상 TypeScript 사용처와 실제 `getStockQueryOptions` import 검증에서
  `query.error`가 `any`가 아니라 endpoint별 `Failure` union으로 잡히고,
  `status` switch에서 literal status/code가 좁혀지는 것을 확인했다.
