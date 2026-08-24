# SSE 오류와 실시간 거래 상태 조사

## 현재 작업 트리의 서버 동작

`GET /realtime/stream`은 SSE를 시작하기 전에 요청을 검증한다.

- 잘못된 `symbols`: HTTP 400 JSON
- 지원하지 않는 종목: HTTP 404 JSON
- 정상 종목: HTTP 200 `text/event-stream`
- 연결 후 실시간 공급자 장애: `event: error` SSE 이벤트

이를 위해 전역 `ApiResponseInterceptor` 등록을 제거하고 일반 JSON controller에만
controller 범위 interceptor를 적용했다. `RealtimeController`는 interceptor를
거치지 않고 `Promise<Observable<MessageEvent>>`를 반환한다. 실제 mock 서버에서도
400, 404, 200 SSE 응답을 확인했다.

## 네이티브 EventSource의 HTTP 오류 처리

서버는 SSE 요청에 HTTP 400이나 404를 반환해 스트림 시작을 거절할 수 있다.
브라우저는 응답 상태를 내부적으로 처리하지만, 네이티브 `EventSource`의 JavaScript
API에는 `Response`, 상태 코드, 응답 본문을 노출하지 않는다. 애플리케이션에는
일반 `error` 이벤트만 전달된다.

따라서 네이티브 `EventSource`를 사용하는 프론트는 다음을 구분할 수 있다.

- `MessageEvent`: HTTP 200으로 연결된 스트림에서 서버가 보낸 `event: error`
- 일반 `Event`: HTTP 거절, 네트워크 단절 등 구체적인 원인을 알 수 없는 연결 오류

400과 404는 둘 다 두 번째 경우이므로 프론트에서 서로 구분할 수 없다.

WHATWG 표준의 네이티브 동작은 연결 종료 후 재연결이며, 서버가 전송한 `retry:`와
마지막 이벤트 ID를 브라우저가 처리한다. 서버가 재연결을 중지시키려면 HTTP 204를
사용할 수 있다.

- [WHATWG Server-sent events](https://html.spec.whatwg.org/dev/server-sent-events.html)

## 실제 구현에서 사용하는 선택지

### 네이티브 EventSource 유지

애플리케이션이 알아야 하는 오류는 HTTP 200으로 스트림을 연 뒤 이름 있는 SSE
이벤트로 전달한다. HTTP 오류는 연결 거절이나 인증 실패 같은 전송 계층의 실패로
사용할 수 있지만, 브라우저 UI는 구체적인 상태와 본문을 알 수 없다.

현재 프론트의 `useEventStream`도 `error` 이벤트가 `MessageEvent`인지 확인해 SSE
오류 데이터와 일반 연결 오류를 구분한다.

### fetch 기반 SSE

HTTP 상태와 본문을 프론트에서 확인해야 할 때 사용한다. 순수 `fetch`로 직접
구현하면 SSE 파싱, 재연결, `retry:`, 마지막 이벤트 ID를 직접 처리해야 한다.
`@microsoft/fetch-event-source` 같은 구현은 응답 검증, SSE 파싱, 재연결 간격과
마지막 이벤트 ID 처리를 제공한다.

- [Microsoft fetch-event-source](https://github.com/Azure/fetch-event-source)

### REST 요청 후 EventSource 연결

SSE의 필수 절차는 아니다. 스트림 생성 전에 작업이나 세션을 만들거나, 네이티브
`EventSource`가 볼 수 없는 상세 검증 오류를 반드시 표시해야 할 때 선택할 수 있다.
추가 요청과 서버 계약이 생긴다.

## 현재 결과 페이지에 미치는 영향

`result/page.tsx`는 `EventSource`를 만들기 전에 `/returns/chart`를 요청한다.
`ReturnsService.chart()`는 먼저 `StocksService.getBySymbol()`을 호출하므로 지원하지
않는 종목은 REST 단계에서 실패한다. 정상 페이지 흐름에서는 이 검증을 통과한
심볼만 SSE에 전달된다.

따라서 현재 `/realtime/stream`의 400과 404는 비정상적인 직접 요청을 거절하는
역할을 한다. 결과 페이지가 두 상태를 EventSource에서 구분할 필요는 없다. 연결 후
사용자에게 보여줘야 하는 공급자 장애는 SSE 이벤트로 전달하고, 네트워크나 알 수
없는 연결 실패는 일반 연결 오류로 처리할 수 있다.

현재 `useEventStream`은 `event: error` MessageEvent를 받으면 `EventSource.close()`를
호출한다. 재시도 가능한 공급자 장애에도 브라우저 자동 재연결을 사용할 것인지는
이 동작과 서버의 스트림 종료 정책을 함께 결정해야 한다.

## NestJS에서 200 SSE가 먼저 전송됐던 원인

기존 전역 `ApiResponseInterceptor`는 핸들러 실행 결과를 Observable 실행 흐름에
넣었다. `@Sse()` 응답기는 Observable을 받으면 200 SSE 헤더를 전송한 뒤 구독하므로,
구독 시점에 발생한 검증 실패를 HTTP 400이나 404로 바꿀 수 없었다.

`@SkipApiResponse()`는 SSE 메시지를 `{ success, data }`로 감싸지 않게 했을 뿐,
interceptor 실행 자체를 제거하지 않았다. metadata 기반 skip도 `next.handle()`을
반환하므로 이 실행 순서를 바꾸지 못했다.

확인한 대안은 다음과 같다.

- Guard 검증: interceptor 전에 실행되므로 HTTP 400과 404 반환 가능
- raw HTTP SSE: 연결 전 응답을 직접 제어하지만 SSE 처리를 직접 소유
- Nest core 변경: 라우트별 전역 interceptor 제외가 가능하지만 사설 경로 유지 필요
- controller 범위 interceptor: JSON controller에만 적용하여 SSE를 실행 체인에서 제외

현재 작업 트리는 마지막 방식을 적용한 상태다.

- [Nest 비동기 SSE 핸들러 지원 PR](https://github.com/nestjs/nest/pull/15721)
- [Nest 요청 실행 순서](https://docs.nestjs.com/faq/request-lifecycle)

## KIS 실시간 계약

KIS 체결·장운영 TR, 필드, KRX/NXT/통합 구분, VI와 시장 서킷브레이커의 데이터
한계는 [KIS 국내주식 실시간 시세·장운영 계약](kis-realtime-market-data.md)에서
관리한다. 이 문서에는 SSE 전송 오류 분석만 둔다.
