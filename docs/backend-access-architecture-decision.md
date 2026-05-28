# Backend Access Architecture Decision

Date: 2026-05-14

## Context

현재 프로젝트는 주식 관련 앱이다.

현재 백엔드는 NestJS로 구현되어 있고, KIS OpenAPI를 호출한다.

```text
front/
  Next.js frontend

back/
  NestJS backend
  KIS access_token / approval_key 관리
  현재가, 일봉, 수익률, 실시간 SSE API 제공
```

현재 백엔드는 독립적인 HTTP 서버다.

즉 프론트 앱과 자동으로 묶여 있는 것이 아니라, 서버 주소와 endpoint를 아는 클라이언트라면 같은 요청을 보낼 수 있다.

```text
프론트 앱
  -> 백엔드 요청 가능

curl / Postman / 다른 서버 / 다른 클라이언트
  -> 같은 백엔드 endpoint 요청 가능
```

이 구조에서 고민한 핵심은 다음이다.

```text
백엔드를 어떻게 노출할 것인가
KIS 키와 KIS 호출 쿼터를 어떻게 보호할 것인가
실시간 SSE 연결과 요청량을 어떻게 제한할 것인가
운영 관점에서 어떤 구조가 관리하기 쉬운가
```

## Problem Awareness

이번 논의의 출발점은 “프론트에서 백엔드로 요청을 보낸다”는 말을 더 정확히 이해하는 것이었다.

처음에는 프론트 앱에서 API 요청 함수를 만들면, 자연스럽게 그 프론트 앱만 백엔드를 사용할 것처럼 보일 수 있었다.

하지만 실제로는 그렇지 않다.

백엔드는 독립적으로 떠 있는 HTTP 서버다.

백엔드는 “내가 만든 프론트 앱”을 자동으로 알고 있는 것이 아니라, 들어온 HTTP 요청을 처리할 뿐이다.

예를 들어 아래 요청은 모두 백엔드 입장에서 같은 형태의 요청이다.

```text
GET /stocks/005930/current
```

이 요청은 여러 곳에서 보낼 수 있다.

```text
내 Next.js 프론트
curl
Postman
다른 웹사이트
다른 서버
봇
```

따라서 첫 번째 문제의식은 다음이었다.

```text
프론트 앱을 만들었다고 해서 백엔드가 그 프론트만 받는 것은 아니다.
```

두 번째 문제의식은 KIS OpenAPI와 연결되어 있다.

현재 백엔드는 단순 데이터 서버가 아니라, 서버 내부의 KIS `APP_KEY`, `APP_SECRET`, `access_token`, `approval_key`를 사용해 KIS API를 호출한다.

따라서 백엔드 endpoint가 열려 있으면, 외부 요청자가 직접 KIS 키를 알지 못하더라도 다음 일이 가능해진다.

```text
외부 요청자
  -> 내 백엔드 호출
  -> 내 백엔드가 KIS API 호출
  -> KIS 쿼터/제한/알림은 내 계정 기준으로 발생
```

즉 백엔드가 KIS API의 공개 대리 호출 창구처럼 동작할 수 있다.

세 번째 문제의식은 요청량과 연결 유지다.

일반 REST API는 요청이 들어오고 응답하면 끝난다.

하지만 실시간 API인 `/realtime/stream`은 SSE 연결을 오래 유지한다.

이 연결은 서버에 계속 자원을 잡는다.

```text
client registry
RxJS subscription
heartbeat interval
KIS WebSocket subscription
```

따라서 단순히 “누가 요청했는가”만 문제가 아니라, “얼마나 많이 요청하고 얼마나 오래 연결을 유지할 수 있는가”도 문제가 된다.

여기서 네 번째 문제의식이 생겼다.

```text
접근 제어와 limit은 별개의 문제이며 둘 다 필요하다.
```

접근 제어가 없으면 아무나 사용할 수 있다.

limit이 없으면 허용된 경로로 들어온 요청도 서버와 KIS 자원을 과도하게 쓸 수 있다.

마지막 문제의식은 관리 방식이다.

rate limit, timeout, SSE buffering, 요청 크기 제한, HTTPS, 로그 같은 것은 주식 도메인 비즈니스 로직이라기보다 트래픽/운영 정책에 가깝다.

그래서 다음 선택지를 비교했다.

```text
Next.js 서버를 BFF처럼 쓸 것인가
Nest 내부에 전부 넣을 것인가
프록시/API Gateway 같은 별도 계층에서 관리할 것인가
```

이 논의의 최종 목적은 다음 질문에 답하는 것이었다.

```text
KIS를 사용하는 백엔드 서버를 어떤 방식으로 외부에 노출하고 보호할 것인가?
```

## Current Backend Behavior

현재 백엔드는 아래 endpoint를 제공한다.

```text
GET /stocks/search
GET /stocks/:code/current
GET /stocks/:code/history
GET /returns
GET /realtime/stream
```

KIS API를 호출하는 endpoint:

```text
GET /stocks/:code/current
GET /stocks/:code/history
GET /returns
GET /realtime/stream
```

현재 구현에서 KIS 토큰은 백엔드에서 관리한다.

```text
KIS access_token
  REST API용

KIS approval_key
  WebSocket 실시간용
```

프론트는 KIS 토큰을 직접 받거나 저장하지 않는다.

## Problems Identified

### 1. Backend Is Independent From Frontend

백엔드는 독립 서버다.

프론트 레포에서 어떤 코드를 만들었는지는 백엔드의 접근 제어와 직접 관련이 없다.

```text
백엔드 서버
  요청 URL / method / query / body 기준으로 처리

프론트 앱
  백엔드를 호출하는 여러 클라이언트 중 하나
```

따라서 백엔드를 public으로 열면, 프론트가 아닌 클라이언트도 같은 endpoint를 호출할 수 있다.

### 2. KIS API Proxy Abuse Risk

현재 KIS 호출 endpoint가 public으로 열리면, 외부 사용자가 백엔드를 통해 KIS API를 계속 호출할 수 있다.

문제:

```text
KIS 호출 쿼터 소모
KIS 토큰 발급/사용 알림 발생
서버 자원 소모
의도하지 않은 비용/제한 발생 가능
```

특히 `/returns`는 한 요청에서 KIS REST API를 두 번 호출한다.

```text
getDailyPrice()
getCurrentPrice()
```

### 3. SSE Resource Risk

`/realtime/stream`은 단발 요청이 아니라 오래 유지되는 연결이다.

현재 SSE 연결이 열리면 서버에는 다음 자원이 생긴다.

```text
client registry state
RxJS subscription
heartbeat interval
KIS WebSocket subscription 가능성
```

제한이 없다면 다음 문제가 생길 수 있다.

```text
SSE 연결 과다
종목 구독 과다
heartbeat timer 누적
서버 메모리/연결 자원 소모
KIS 실시간 구독 남용
```

### 4. Rate Limit / Timeout / Cache Needed

권한 문제와 별개로 limit 계층이 필요하다.

필요한 제한:

```text
HTTP 요청 rate limit
SSE 연결 수 제한
SSE 연결당 종목 수 제한
KIS 호출 timeout
KIS 응답 cache
KIS 호출 dedupe
KIS circuit breaker
```

권한만 있어도 내부 사용자가 실수로 폭주할 수 있고, limit만 있어도 외부 사용자가 조금씩 계속 호출할 수 있다.

따라서 접근 제어와 limit은 둘 다 필요하다.

## Options Discussed

### Option A: Browser Directly Calls Nest Backend

구조:

```text
Browser
  -> Nest Backend
  -> KIS OpenAPI
```

장점:

```text
구조가 단순함
프론트에서 바로 API 호출 가능
```

단점:

```text
백엔드 주소가 노출됨
endpoint를 아는 클라이언트가 직접 호출 가능
KIS 쿼터/서버 자원 보호가 약함
운영 정책을 Nest 앱 내부에 많이 넣어야 함
```

결론:

```text
운영 구조로는 부적합
개발/초기 테스트용으로만 적합
```

### Option B: CORS / Origin Restriction

논의 중 CORS도 언급되었지만 최종 방향에서는 제외했다.

이유:

```text
CORS는 브라우저 정책이다.
curl, Postman, 다른 서버 요청을 막는 인증 수단이 아니다.
```

결론:

```text
이번 의사결정의 핵심 수단으로 사용하지 않음
```

### Option C: Next.js Server as BFF

구조:

```text
Browser
  -> Next.js Server
  -> Nest Backend
  -> KIS OpenAPI
```

Next.js 서버 역할:

```text
브라우저 요청 수신
Nest 요청 중계
server-only secret header 추가 가능
필요 시 응답 조합/가공
rate limit 구현 가능
```

장점:

```text
프론트 요구에 맞게 데이터를 조합하기 좋음
TypeScript 코드로 제어 가능
브라우저에 secret을 노출하지 않고 서버에서 Nest 호출 가능
```

단점:

```text
Next UI와 Next server logic이 같은 프로젝트 안에서 함께 관리됨
운영/트래픽 정책이 앱 코드에 들어감
단순 보호 목적이라면 과한 애플리케이션 로직이 될 수 있음
```

결론:

```text
프론트 전용 데이터 조합이 필요해지면 BFF로 고려
하지만 현재 주요 문제인 트래픽 제한/접근 제어/timeout/SSE 보호에는 프록시가 더 적합
```

### Option D: Proxy / API Gateway

구조:

```text
Browser
  -> Proxy / API Gateway
  -> Nest Backend
  -> KIS OpenAPI
```

프록시 역할:

```text
요청 라우팅
rate limit
SSE 연결 제한
timeout
요청 크기 제한
HTTPS 처리
로그
필요 시 내부 secret header 추가
```

Nest 역할:

```text
비즈니스 로직
KIS 토큰 관리
KIS REST 호출
KIS WebSocket 연결
수익률 계산
SSE 이벤트 생성
```

장점:

```text
트래픽/운영 정책을 앱 코드 밖에서 관리 가능
백엔드를 직접 public으로 노출하지 않는 구조를 만들기 쉬움
SSE timeout/buffering 같은 네트워크 설정에 적합
rate limit, timeout, 로그 관리가 명확함
장기적으로 관리 주체가 분리됨
```

단점:

```text
프록시 서버 또는 관리형 프록시 서비스를 별도로 띄워야 함
프록시 설정 파일/인프라 설정을 관리해야 함
```

결론:

```text
현재 요구조건에는 프록시/API Gateway 방식이 가장 적합
```

## Decision

프록시 기반 구조로 간다.

최종 방향:

```text
Browser
  -> Proxy / API Gateway
  -> Nest Backend
  -> KIS OpenAPI
```

백엔드는 가능한 한 public internet에 직접 노출하지 않는다.

```text
외부 공개 endpoint
  Proxy / API Gateway

내부 backend
  NestJS
```

프론트는 Nest backend를 직접 호출하지 않고, 프록시 주소를 호출한다.

```text
프론트
  -> https://api.example.com/...

프록시
  -> 내부 Nest backend
```

## Why Proxy Was Chosen

이번 요구의 핵심은 프론트 전용 데이터 조합이 아니라, 운영/보호 정책이다.

필요한 것:

```text
백엔드 직접 노출 방지
요청량 제한
SSE 연결 제한
timeout
요청 크기 제한
로그
KIS 호출 보호
```

이 영역은 Next.js BFF보다 프록시/API Gateway가 더 잘 맞는다.

역할이 깔끔하게 나뉜다.

```text
Proxy / API Gateway
  트래픽 관리
  접근 경로 관리
  네트워크 정책

Nest Backend
  주식/KIS 비즈니스 로직
```

## What "Proxy Server" Means

프록시 서버는 직접 새 Node 서버를 코딩한다는 뜻이 아니다.

보통 검증된 프록시 프로그램이나 관리형 서비스를 사용한다.

예:

```text
Caddy
nginx
Traefik
Envoy
Cloudflare
AWS API Gateway
AWS ALB
```

프록시는 반드시 어딘가에 떠 있어야 한다.

가능한 위치:

```text
1. 백엔드와 같은 서버
   프록시만 외부 공개
   Nest는 내부 포트로만 접근

2. 별도 프록시 서버
   프록시 서버는 public
   Nest 서버는 private network

3. 관리형 서비스
   Cloudflare, AWS API Gateway, ALB 등
```

## Planned Responsibilities

### Proxy / API Gateway

담당:

```text
외부 요청 수신
Nest backend로 reverse proxy
rate limit
SSE 연결 제한
timeout
요청 크기 제한
HTTPS
접근 로그
필요 시 internal secret header 추가
```

REST API에 적용할 정책:

```text
/stocks/:code/current
  요청 rate limit
  timeout

/stocks/:code/history
  요청 rate limit
  timeout

/returns
  더 강한 rate limit
  timeout
```

SSE에 적용할 정책:

```text
/realtime/stream
  연결 수 제한
  연결당 유지 timeout 조정
  buffering off
  proxy read timeout 길게
```

### Nest Backend

담당:

```text
KIS access_token 관리
KIS approval_key 관리
KIS REST API 호출
KIS WebSocket 연결
종목 검색
일봉/현재가 조회
수익률 계산
SSE 이벤트 생성
```

Nest 내부에서도 유지할 안전장치:

```text
stockCodes 개수 제한
날짜 검증 강화
KIS fetch timeout
KIS cache
KIS 호출 dedupe
KIS circuit breaker
WebSocket reconnect/resubscribe
에러 메시지 정리
```

## Follow-up Work

프록시 도입 후에도 백엔드 내부 개선은 필요하다.

우선순위:

```text
1. /realtime/stream stockCodes 형식/개수 제한
2. SSE 연결 수 제한 정책 결정
3. HTTP rate limit 정책 결정
4. KIS fetch timeout 추가
5. 현재가/일봉 cache 추가
6. KIS WebSocket 재연결/재구독 구현
7. 날짜 검증 강화
8. KIS candle 날짜 일치 검증
9. 운영 WebSocket URL wss:// 사용
10. 외부 응답 에러 메시지 정리
```

## Final Summary

최종 의사결정:

```text
프록시/API Gateway를 공개 입구로 둔다.
Nest 백엔드는 프록시 뒤에 둔다.
프론트는 프록시 주소로 요청한다.
KIS 로직은 Nest에 유지한다.
rate limit, timeout, SSE 네트워크 정책은 프록시에서 우선 관리한다.
KIS 관련 안전장치는 Nest 내부에도 별도로 둔다.
```
