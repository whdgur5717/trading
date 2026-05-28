# 프로젝트 맥락

## 도메인

이 프로젝트는 한국 주식 시장 데이터를 다루는 백엔드다.

외부 데이터 원천으로 KIS, 한국투자증권 Open API를 사용한다. KIS에서 가져온
한국 주식 시장 데이터를 서비스에서 사용할 수 있는 형태로 해석한다.

현재가, 과거 가격, 실시간 시세처럼 시간과 시장 상태에 영향을 받는 데이터를
다룬다. 투자 수익 계산처럼 시장 데이터를 기반으로 사용자가 이해할 수 있는
결과를 만드는 로직도 이 프로젝트의 맥락에 포함된다.

## 기술 구성

백엔드는 NestJS 기반이다.

KIS 연동에는 REST API와 WebSocket 기반 실시간 채널이 함께 사용된다. KIS의
실시간 데이터는 WebSocket 채널을 통해 들어오고, 프론트에 제공하는 실시간
데이터는 SSE(Server-Sent Events) 형태로 내려준다.

HTTP 요청/응답 흐름과 SSE 흐름은 장애 양상이 다르다. 실시간 기능을 볼 때는
KIS WebSocket 연결, 내부 구독 상태, 프론트 SSE 연결 상태를 함께 고려해야 한다.

## API 계약

프론트가 사용하는 API 계약은 OpenAPI/Swagger를 기반으로 관리된다.

OpenAPI 문서는 NestJS Swagger 플러그인을 통해 생성되는 흐름을 전제로 한다.
일반적인 HTTP API에 Swagger annotation을 직접 추가하지 않는다.

SSE, WebSocket, OpenAPI 플러그인이 자동으로 표현하지 못하는 계약은 예외다. 이런
경우에는 필요한 annotation을 명시적으로 추가할 수 있다.

프론트는 OpenAPI 계약에서 생성된 타입과 스키마를 사용해 백엔드 응답을 다룬다.
계약이 바뀌면 프론트 생성 코드도 함께 갱신된다.

## KIS 연동 주의사항

KIS는 외부 증권 API이므로 호출량과 인증 흐름을 신중하게 다뤄야 한다.

같은 데이터를 짧은 시간에 반복 조회하거나, 인증 토큰과 WebSocket 승인키를
불필요하게 반복 발급하는 흐름을 만들지 않는다. KIS 호출에는 속도 제한, 발급
제한, 시장 운영 시간, 비거래일, 외부 장애, 데이터 지연 같은 조건이 영향을 줄 수
있다.

실시간 연결은 오래 유지되는 자원이다. 구독 추가/해제, 재연결, heartbeat, 장애
전파가 서로 어긋나지 않도록 봐야 한다.

## 테스트 환경과 작성 기준

백엔드 테스트는 Vitest로 실행한다. `src/**/*.spec.ts`는 단위 테스트 계층이고,
`test/e2e/**/*.spec.ts`는 Nest 애플리케이션을 실제로 띄우는 e2e 계층이다.

`src/**/*.spec.ts`에서는 외부 세계를 끊고 해당 클래스나 함수의 정책을 검증한다.
예를 들어 `kis.service.spec.ts`는 `KisService` 객체는 실제로 사용하지만
`global.fetch`를 `vi.fn()`으로 교체한다. 따라서 실제 KIS 요청은 나가지 않는다.
이 계층에서는 토큰 캐시, 중복 요청 방지, 재시도, 타임아웃, 매핑, 계산, 검증 같은
내부 분기와 순수 로직을 빠르게 확인한다.

`test/e2e/**/*.spec.ts`에서는 `Test.createTestingModule`로 실제 `AppModule`을
구성하고 `configureApp()`까지 적용한다. 이 계층은 controller, pipe,
interceptor/filter, service wiring, HTTP 응답 형태를 함께 검증한다.

e2e에서도 실제 KIS는 호출하지 않는다. KIS REST API는 `msw/node`의
`setupServer()`로 가로채고, KIS WebSocket은 `test/support/kis/websocket.ts`의
로컬 `ws` 서버로 대체한다. REST는 요청 경로와 응답 계약을 검증하기 위해 MSW를
사용하고, WebSocket은 연결 유지와 subscribe/unsubscribe, push 메시지 흐름을
검증하기 위해 별도 서버를 사용한다.

새 테스트를 추가할 때는 먼저 계층을 고른다. 단일 서비스의 계산, 캐시, 예외,
재시도 로직이면 `src/**/*.spec.ts`에 둔다. HTTP API 전체 흐름, Nest 설정,
OpenAPI 계약에 가까운 응답 형태, SSE/WebSocket 연동 흐름을 확인해야 하면
`test/e2e/**/*.spec.ts`에 둔다. 테스트에서 실제 KIS 인증키나 운영 API에
의존하지 않는다.
