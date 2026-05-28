# Backend Pre-Deploy Fix List

Date: 2026-05-14

## Purpose

이 문서는 현재 NestJS 백엔드를 배포하기 전에 수정할 수 있는 부분을 정리한다.

핵심은 “기능이 돌아가느냐”가 아니라, 외부에 노출되었을 때 서버와 KIS 계정을 안전하게 운영할 수 있느냐이다.

현재 백엔드는 KIS OpenAPI를 대신 호출하는 서버다.

따라서 백엔드 endpoint가 열려 있으면, 요청자는 KIS 키를 직접 몰라도 내 서버를 통해 KIS API를 사용할 수 있다.

```text
외부 요청자
  -> 내 백엔드 endpoint 호출
  -> 내 백엔드가 KIS access_token / approval_key 사용
  -> KIS 호출량과 제한은 내 계정 기준으로 발생
```

그래서 배포 전 수정의 기준은 다음이다.

```text
1. Nest 서버를 아무나 직접 호출하지 못하게 한다.
2. 허용된 요청도 과도하게 많이 들어오지 못하게 한다.
3. KIS 장애/지연/토큰 만료 상황에서도 서버가 예측 가능하게 동작하게 한다.
4. SSE 실시간 연결이 서버 자원을 무제한 잡지 못하게 한다.
```

## Current Assumption

아키텍처 결정은 프록시 방식을 기준으로 한다.

```text
Browser / Client
  -> Proxy
  -> Nest Backend
  -> KIS OpenAPI
```

프록시는 public 입구다.

Nest 백엔드는 프록시 뒤에 둔다.

Nest는 주식/KIS 비즈니스 로직을 담당하고, 프록시는 외부 노출, 요청 제한, timeout, SSE 정책 같은 트래픽 정책을 담당한다.

관련 문서:

```text
docs/backend-access-architecture-decision.md
```

## Priority Summary

- [x] P0 Exposure: Nest listen host를 env로 고정
  - 이유: 서버 주소만 알면 누구든 KIS-backed API를 호출할 수 있음
  - 구현: `back/src/main.ts`, `back/src/config/env.validation.ts`

- [ ] P0 Proxy Limit: REST/SSE rate limit
  - 이유: KIS 쿼터와 서버 자원 보호
  - 구현 위치: 프록시 설정

- [x] P0 SSE Input: 종목 코드 형식/개수 제한
  - 이유: 실시간 구독 남용 방지
  - 구현: `back/src/realtime/realtime.controller.ts`

- [x] P0 KIS Timeout: 모든 KIS fetch에 timeout 추가
  - 이유: KIS 지연 시 서버 요청이 무기한 대기하지 않게 함
  - 구현: `back/src/kis/kis.service.ts`

- [x] P1 KIS Token: 인증 실패 시 토큰 캐시 삭제 후 1회 재시도
  - 이유: 만료/무효 토큰으로 계속 실패하는 상황 방지
  - 구현: `back/src/kis/kis.service.ts`

- [x] P1 Realtime Feed: 끊김 후 재연결/재구독
  - 이유: SSE는 살아 있는데 가격 이벤트가 멈추는 상황 방지
  - 구현: `back/src/realtime/realtime.service.ts`, `back/src/realtime/realtime-subscription-registry.ts`

- [x] P1 SSE Cleanup: 구독 도중 클라이언트 disconnect 처리
  - 이유: 실시간 feed 구독 누수 방지
  - 구현: `back/src/realtime/realtime.service.ts`, `back/src/realtime/realtime-subscription-registry.ts`

- [x] P1 Realtime Abstraction: 실시간 모듈에서 KIS payload 직접 생성/파싱 제거
  - 이유: OpenAPI 제공자 교체 시 `realtime` 핵심 흐름을 다시 뜯지 않게 함
  - 구현: `back/src/realtime/realtime-feed.ts`, `back/src/realtime/realtime.service.ts`, `back/src/kis/kis.service.ts`

- [x] P1 Validation: 날짜 검증 강화
  - 이유: 형식만 맞는 잘못된 날짜 차단
  - 구현: `back/src/common/date-validation.ts`, `back/src/stocks/stocks.controller.ts`, `back/src/returns/returns.controller.ts`

- [x] P2 Env: 위험한 KIS URL default 제거
  - 이유: 실수로 테스트/잘못된 KIS URL을 쓰는 배포 방지
  - 구현: `back/src/config/env.validation.ts`

- [x] P2 Runtime Surface: Swagger production 비활성화 / 전역 CORS 제거
  - 이유: 운영에서 불필요한 문서 endpoint와 브라우저 직접 호출 표면 축소
  - 구현: `back/src/main.ts`, `back/src/config/env.validation.ts`

- [x] P2 Ops: health endpoint 추가
  - 이유: 프록시/배포 환경에서 서버 상태 확인
  - 구현: `back/src/health/health.controller.ts`, `back/src/health/health.module.ts`

## Current Implementation Status

현재까지 코드에 반영된 항목은 다음이다.

```text
Done:
  - HOST env를 읽어 Nest listen host로 사용
  - KIS_REST_BASE_URL default 제거
  - KIS_WS_URL default 제거
  - /realtime/stream stockCodes 형식/개수 제한
  - SSE 구독 도중 client disconnect 시 실시간 feed 구독 누수 방어
  - KIS fetch timeout 5초 적용
  - KIS 인증 실패 시 access token cache 삭제 후 1회 재시도
  - 실시간 feed WebSocket close 후 재연결/기존 종목 재구독
  - realtime service에서 KIS 전용 payload 생성/파싱 제거
  - 날짜 query 실제 calendar date/KST 미래 날짜 검증
  - production에서 Swagger 비활성화
  - CORS 전역 허용 제거
  - GET /health 추가

Still Todo:
  - 프록시 rate limit / timeout / SSE 정책
```

검증 상태:

```text
pnpm format: pass
pnpm lint: pass
pnpm test: pass
pnpm build: pass
```

## Fix Details

### 1. Block Direct Public Access To Nest

현재 Nest는 HTTP 서버로 독립 실행된다.

프론트 레포와 자동으로 묶여 있는 것이 아니므로, 주소와 endpoint를 알면 누구나 요청을 보낼 수 있다.

수정 방향:

```text
Proxy만 public으로 노출
Nest는 private network 또는 localhost/upstream으로만 접근
방화벽/보안그룹에서 Nest port 직접 접근 차단
```

관련 파일:

```text
back/src/main.ts
```

현재 구현:

```text
app.listen(port, host)
```

`HOST`는 env에서 읽는다.

운영에서는 예를 들어 다음처럼 둔다.

```text
HOST=127.0.0.1
```

이렇게 하면 같은 서버 안의 프록시는 Nest에 접근할 수 있지만, 외부 사용자는 Nest port로 직접 접근할 수 없다.

주의:

```text
이 코드 수정은 Nest가 어떤 host에 bind될지를 정하는 것이다.
실제 외부 port 차단은 방화벽/보안그룹/프록시 배포 설정에서 같이 해야 한다.
```

### 2. Add Proxy-Level Limits

이 제한은 Nest 내부 비즈니스 로직보다 프록시에서 먼저 처리하는 것이 맞다.

REST API 제한:

```text
GET /stocks/search
GET /stocks/:code/current
GET /stocks/:code/history
GET /returns
```

필요한 정책:

```text
IP별 초당/분당 요청 수 제한
요청 timeout
응답 timeout
요청 body/query 크기 제한
비정상 반복 요청 차단
```

SSE API 제한:

```text
GET /realtime/stream
```

필요한 정책:

```text
IP별 동시 SSE 연결 수 제한
SSE 연결 최대 유지 시간
연결 idle timeout
upstream buffering 비활성화 또는 SSE용 설정 분리
```

이 항목은 Nest 코드만으로 끝나는 문제가 아니다.

프록시 설정에 반드시 포함되어야 한다.

### 3. Limit SSE Stock Codes

`/realtime/stream`은 SSE endpoint다.

현재는 `@Sse("stream")`을 유지한 상태에서, `stockCodes` query 검증을 추가했다.

관련 파일:

```text
back/src/realtime/realtime.controller.ts
back/src/realtime/realtime-subscription-registry.ts
back/src/realtime/realtime.service.ts
```

구현된 정책:

```text
stockCodes query 최대 길이: 128
한 SSE 연결당 최대 종목 수: 10
각 종목 코드 형식: 6자리 숫자
빈 segment 거부
중복 종목 제거
stock master에 없는 종목 거부
```

허용 예:

```text
GET /realtime/stream?stockCodes=005930
GET /realtime/stream?stockCodes=005930,000660
```

거부 예:

```text
GET /realtime/stream?stockCodes=
GET /realtime/stream?stockCodes=abc
GET /realtime/stream?stockCodes=005930,
GET /realtime/stream?stockCodes=005930,abc
GET /realtime/stream?stockCodes=<10개 초과>
```

### 4. Add Timeout To KIS REST Requests

KIS REST 요청은 `fetchKis()` wrapper를 통해 호출하도록 변경했다.

관련 파일:

```text
back/src/kis/kis.service.ts
```

대상:

```text
/oauth2/tokenP
/oauth2/Approval
현재가 조회
일봉 조회
```

수정 방향:

```text
AbortController로 timeout 적용
timeout 발생 시 BadGatewayException 반환
KIS 비정상 응답과 네트워크 실패를 같은 형태로 정리
```

구현된 정책:

```text
KIS request timeout: 5초
timeout 시 502 Bad Gateway
message: KIS request timed out
```

대상 fetch:

```text
access token 발급
approval key 발급
현재가/일봉 REST 조회
```

### 5. Retry Once After KIS Auth Failure

access token 캐싱과 동시 발급 요청 dedupe는 보강되어 있다.

추가로 KIS가 인증 실패를 반환했을 때 캐시를 지우고 재발급한 뒤 다시 요청하는 흐름도 구현했다.

관련 파일:

```text
back/src/kis/kis.service.ts
```

현재 구현:

```text
KIS REST 요청
  -> HTTP 401/403 또는 KIS token/auth 만료성 응답 감지
  -> access token cache 삭제
  -> access token 새로 발급
  -> 원래 요청 1회 재시도
  -> 재시도 후에도 실패하면 BadGatewayException
```

주의:

```text
무한 재시도 금지
최대 1회 재시도
재시도 후에도 실패하면 BadGatewayException
```

### 6. Reconnect And Resubscribe Realtime Feed

실시간 feed WebSocket이 닫히면 내부 상태를 비우고, 기존 SSE 클라이언트가 요청했던 종목을 기준으로 다시 연결한 뒤 재구독한다.

현재 feed 구현체는 KIS adapter다. `realtime` 모듈은 `RealtimeFeed` 인터페이스만 사용하고, KIS 전용 payload 생성/파싱은 `back/src/kis/kis.service.ts`와 `back/src/kis/kis-mappers.ts`에 둔다.

관련 파일:

```text
back/src/realtime/realtime.service.ts
back/src/realtime/realtime-feed.ts
back/src/kis/kis.service.ts
```

기존 위험:

```text
프론트의 SSE 연결은 살아 있음
실시간 feed WebSocket은 끊김
가격 이벤트는 더 이상 안 옴
사용자는 연결이 살아 있다고 착각할 수 있음
```

현재 구현:

```text
실시간 feed WebSocket close 감지
현재 SSE registry에 남아 있는 종목 목록 확인
최대 3회만 연결 시도
기존 종목 재구독
3회 실패 시 SSE error event 전달 후 스트림 종료
실패 잠금 시간 동안 새 SSE 요청이 와도 feed 연결 시도 안 함
재연결 성공 시 SSE reconnected event 전달
```

추가 구현:

```text
연결 시도 간격: 즉시, 1초 후, 3초 후
3회 실패 후 재연결 잠금: 5분
SSE error event code: FEED_UNAVAILABLE
동시 재연결 dedupe
오래된 WebSocket close handler가 새 ws 상태를 지우지 않게 방지
서버 종료 중이면 재연결하지 않음
활성 SSE 구독 종목이 없으면 연결 시도 예약 취소
```

### 7. Clean Up SSE Subscribe Race

`subscribeStockCode(stockCode)`는 비동기로 실행된다.

그 사이 클라이언트가 SSE 연결을 끊으면, 실제로는 더 이상 보는 사람이 없는데 feed 구독이 남을 수 있다.

관련 파일:

```text
back/src/realtime/realtime.service.ts
```

수정 방향:

```text
subscribeStockCode() 전후로 해당 stockCode를 보는 client가 아직 있는지 확인
연결이 끊긴 뒤 완료된 구독이면 즉시 unsubscribe
subscribe 실패 시 registry 상태와 feed 상태가 어긋나지 않게 정리
```

현재 구현:

```text
RealtimeSubscriptionRegistry.isStockCodeActive(stockCode) 추가
feed subscribe 직전 client 존재 여부 확인
feed subscribe 직후 client 존재 여부 재확인
아무도 보지 않으면 즉시 unsubscribe
```

### 8. Validate Dates Strictly

날짜 query는 공통 스키마로 검증한다.

관련 파일:

```text
back/src/common/date-validation.ts
back/src/stocks/stocks.controller.ts
back/src/returns/returns.controller.ts
```

현재 검증:

```text
YYYY-MM-DD 형식인지 확인
실제 존재하는 calendar date인지 확인
KST 기준 미래 날짜 차단
```

차단 예:

```text
2026-99-99
2026-02-31
2026-2-3
KST 기준 내일 이후 날짜
```

적용 endpoint:

```text
GET /stocks/:code/history?date=YYYY-MM-DD
GET /returns?code=005930&buyDate=YYYY-MM-DD&quantity=10
```

### 9. Remove Unsafe Production Defaults

운영에서 위험한 KIS URL default는 제거했다.

관련 파일:

```text
back/src/config/env.validation.ts
```

현재 상태:

```text
NODE_ENV: required
HOST: required
KIS_REST_BASE_URL: required
KIS_WS_URL: required
```

다음 값은 기존 default를 유지한다.

```text
PORT=4000
KIS_MARKET_CODE=J
KIS_REALTIME_TR_ID=H0STCNT0
```

필수 env 예:

```text
NODE_ENV=production
APP_KEY=<KIS app key>
APP_SECRET=<KIS app secret>
HOST=127.0.0.1
KIS_REST_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_WS_URL=ws://ops.koreainvestment.com:21000/tryitout
```

CORS는 기본으로 열지 않는다.

필요할 때만 쉼표로 구분해서 명시한다.

```text
CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

Swagger는 별도 env를 추가하지 않는다.

```text
NODE_ENV=production이면 /docs 미노출
NODE_ENV=development 또는 test이면 /docs 노출
```

### 10. Add Health Endpoint

프록시나 배포 환경이 Nest 상태를 확인할 endpoint가 필요하다.

수정 방향:

```text
GET /health
```

응답 예시:

```json
{
  "status": "ok"
}
```

주의:

```text
health check에서 KIS API까지 호출하지 않는다.
단순히 Nest 프로세스가 요청을 받을 수 있는지만 확인한다.
```

## Suggested Implementation Order

### Phase 1: Code Safety

먼저 Nest 내부에서 바로 수정할 수 있는 항목을 처리한다.

```text
1. SSE stockCodes 검증/최대 개수 제한 - Done
2. KIS fetch timeout - Done
3. KIS auth failure 1회 재시도 - Done
4. 날짜 검증 강화 - Done
5. health endpoint 추가 - Done
6. production Swagger 비활성화 / 전역 CORS 제거 - Done
```

이 단계는 프록시 설정과 별개로 바로 구현 가능하다.

### Phase 2: Realtime Stability

SSE와 realtime feed WebSocket 안정성을 보강한다.

```text
1. Realtime feed WebSocket 재연결 - Done
2. 기존 종목 재구독 - Done
3. subscribe 중 disconnect race 처리 - Done
4. 오래된 ws handler가 새 상태를 덮지 않게 방지 - Done
5. realtime service에서 KIS 전용 payload 생성/파싱 제거 - Done
```

이 단계는 실시간 기능의 안정성에 직접 영향을 준다.

### Phase 3: Proxy Deployment Policy

프록시를 public entrypoint로 둔다.

```text
1. Nest port 직접 접근 차단
2. REST rate limit
3. SSE 동시 연결 제한
4. timeout 설정
5. SSE buffering 정책 설정
6. access/error log 설정
```

이 단계가 끝나야 외부 배포 형태가 안전해진다.

## Final Direction

최종 구조는 다음을 목표로 한다.

```text
Proxy
  외부 노출
  rate limit
  timeout
  SSE 연결 정책
  logging

Nest Backend
  종목 검색
  KIS REST 호출
  KIS token / approval_key 관리
  SSE 이벤트 생성
  Realtime feed WebSocket 구독 관리

KIS OpenAPI
  실제 주식 데이터 제공
```

즉 프록시는 문지기 역할이고, Nest는 KIS 비즈니스 로직 서버다.

배포 전 수정의 핵심은 Nest에 모든 운영 정책을 몰아넣는 것이 아니라, 프록시와 Nest가 맡을 역할을 나누는 것이다.
