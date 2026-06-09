# Roadmap

## KIS OpenAPI 경계 정리

### 배경

KIS adaptor는 KIS OpenAPI 호출, 인증, 응답 변환을 담당한다.

문제는 KIS가 외부 API 공급자 이름인데, 이 이름과 개념이 가격 조회, 실시간 구독, 휴장일 조회 같은 상위 흐름까지 넓게 퍼져 있다는 점이다.

KIS OpenAPI는 변경될 수 있고, 다른 외부 API로 일부 기능을 교체할 수도 있다. 이때 상위 모듈이 특정 공급자 구현에 직접 의존하면, 실제 변경 범위보다 더 많은 코드가 공급자 변경의 영향을 받는다.

정리하려는 핵심은 KIS를 없애는 것이 아니라, KIS를 외부 시장 데이터 연동의 구현체로 좁히는 것이다.

### 목표

앞으로는 모듈 이름과 경계를 특정 공급자보다 외부 시장 데이터 연동 책임에 맞춘다.

- 애플리케이션 도메인이 KIS 공급자 이름에 직접 의존하지 않게 한다.
- 가격 조회, 휴장일 조회, 실시간 시세 연결을 외부 시장 데이터 기능으로 묶는다.
- KIS는 외부 시장 데이터 계층의 한 구현체로 둔다.
- 이후 다른 공급자나 mock 구현을 추가해도 상위 모듈의 책임이 바뀌지 않게 한다.

### 적용된 방향

- `MarketDataModule`과 `RealtimeTradeFeedModule`을 외부 시장 데이터 조립 지점으로 둔다.
- 상위 모듈은 특정 공급자명이 드러나지 않는 port를 의존한다.
- KIS는 `market/adaptor/kis` 아래의 구현체로 둔다.

### 예상 구조

```text
PricesModule
  -> MarketDataPort
      -> KIS adaptor

RealtimeModule
  -> RealtimeTradeFeedPort
      -> KIS adaptor
```

### 정리할 책임

- 외부 가격 조회
- 외부 거래일/휴장일 조회
- 외부 실시간 시세 연결
- 외부 응답을 내부 가격 데이터로 변환

### 결정

- 모듈은 `MarketDataModule`과 `RealtimeTradeFeedModule`로 나눈다.
- port는 시세 데이터와 실시간 체결 피드로 나눈다.
- KIS 구현은 `market/adaptor/kis` 내부에 둔다.
