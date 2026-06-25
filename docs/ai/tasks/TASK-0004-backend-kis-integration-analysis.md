# TASK-0004: Backend KIS Integration Analysis

Status: Done
Last updated: 2026-06-24

## Goal

`back` 패키지의 KIS OpenAPI 호출부, 외부 데이터 Port/Adapter 구조, MSW 기반
외부 API mock 경계, 과거 직접 KIS 의존 코드와 현재 구조의 결합도 변화를 코드
기준으로 분석한다.

## Scope

- `back/src/market/adaptor/kis`, `back/src/market/port`, `back/src/market` 조사.
- `back/test/support/external`와 `back/scripts/dev-mock.ts`의 MSW/mock 경계 조사.
- KIS 공식 포털의 호출 유량 공지와 로컬 `back/docs/kis` 문서 비교.
- git history의 `913748b` 직접 KIS 의존 구조와 현재 워크트리 비교.

## Findings

- 현재 KIS REST 호출 경계는 `AuthorizationProvider`, `RequestProvider`,
  `MarketDataAdaptor`에 있고, WebSocket 경계는 `RealtimeAdaptor`와
  `RealtimeFeedSession`에 있다.
- 공개 기능 계층의 KIS 구체 import는 과거 `913748b` 기준 8개였고, 현재
  feature/config/common 경계에서는 0개다. KIS 구현체 import는 `market` 조립
  모듈 내부로만 남았다.
- 공식 KIS 공지 기준 REST 유량은 실전 18/sec, 모의 1/sec, `/oauth2/tokenP`
  1/sec이며, WebSocket은 계좌/appkey 단위 1 session과 실시간 등록 41건 제한이
  있다.
- 현재 코드의 access token은 process memory cache와 in-flight request dedupe가
  있지만, approval key는 로컬 문서의 23시간 캐시 설명과 달리 현재 코드에서
  캐시되지 않는다.
- 현재 `start:mock`과 e2e support는 KIS/FSC/OpenDART outbound HTTP를 MSW로
  가로채고, KIS WebSocket은 로컬 mock server로 대체한다.

## Verification

- `rg`로 현재 `back/src` KIS 호출/문서/mock 위치를 스캔했다.
- `git grep`으로 `913748b`의 KIS import 수를 계산했다.
- `node`로 현재 OpenAPI path 목록과 import metric을 계산했다.
- KIS 공식 포털 공지 API와 API 문서 페이지를 조회해 호출 유량과 인증 제한을
  확인했다.
- 분석 작업이므로 test suite는 실행하지 않았다.
