# 백엔드 모듈 역할

## 역할 요약

| 모듈                    | DDD 관점 역할       | 안정적인 역할                                     |
| ----------------------- | ------------------- | ------------------------------------------------- |
| StocksModule            | 기준 데이터         | 종목을 식별하고 찾기 위한 기준 데이터를 제공한다. |
| PricesModule            | 도메인 서비스       | 가격을 조회하고, 사용할 가격의 기준을 결정한다.   |
| ReturnsModule           | 애플리케이션 서비스 | 결과 화면 요청 흐름을 조율하고 응답을 구성한다.   |
| MarketDataModule        | 인프라 조립         | 가격/거래일 데이터 port의 구현체를 선택한다.      |
| RealtimeTradeFeedModule | 인프라 조립         | 실시간 체결 피드 port의 구현체를 선택한다.        |
| RealtimeModule          | 애플리케이션 서비스 | 실시간 가격 전달 흐름을 조율한다.                 |

## 의존성

모듈은 요청 흐름과 책임에 따라 계층을 가진다.

상위 모듈은 사용자 요청 흐름을 조율한다. 하위 모듈은 그 흐름에 필요한 capability를 제공한다.

주의:

- 모듈을 같은 깊이의 기능 목록처럼 취급하지 않음.
- 하위 모듈이 상위 요청 흐름을 알게 만들지 않음.
- 외부 API 세부사항을 애플리케이션 흐름에 직접 퍼뜨리지 않음.

현재 구조에서 결과 화면 요청은 `ReturnsModule`에서 시작한다. 가격 판단은 `PricesModule`에 위임한다. `PricesModule`은 가격 기준을 정하기 위해 종목 기준 데이터와 외부 시세 데이터를 사용한다.

실시간 가격 전달은 `RealtimeModule`에서 시작한다. `RealtimeModule`은 구독 흐름을 조율하고, 종목 기준 데이터와 외부 실시간 시세 연결을 사용한다.

의존 방향은 상위 흐름에서 하위 capability로만 내려간다.

```text
애플리케이션 흐름
  -> 도메인 capability
      -> 기준 데이터
      -> 인프라 어댑터
```

## StocksModule

종목을 식별하기 위한 기준 데이터를 담당한다.

현재 다루는 범위:

- 종목 코드
- 종목명
- 시장명
- 시세 시장
- 검색과 자동완성에 필요한 후보 데이터

## PricesModule

가격과 관련된 도메인 판단을 담당한다.

현재 다루는 범위:

- 특정 종목의 가격 조회
- 특정 날짜의 가격 조회
- 결과 화면에서 사용할 현재 가격 결정
- 가격 기준 정보 구성

가격 기준은 화면과 계산에서 같은 의미로 사용할 수 있어야 한다.

## ReturnsModule

결과 화면 요청을 처리하는 흐름을 담당한다.

현재 다루는 범위:

- 사용자 입력을 기준으로 필요한 데이터를 요청한다.
- 가격 데이터를 받아 결과 화면 응답을 구성한다.
- 손익 관련 산출 결과를 응답에 포함한다.

가격을 어떻게 정할지는 `PricesModule`의 책임이다.

## MarketDataModule / RealtimeTradeFeedModule

외부 시장 데이터 공급자 구현체를 port에 연결한다.

현재 다루는 범위:

- `MarketDataModule`: 가격/거래일 데이터 port 조립
- `RealtimeTradeFeedModule`: 실시간 체결 피드 port 조립

KIS API 세부사항은 `market/adaptor/kis` 안에서 처리한다.

## RealtimeModule

실시간 가격 전달 흐름을 담당한다.

현재 다루는 범위:

- 실시간 구독 요청 처리
- 구독 대상 종목 확인
- 외부 실시간 가격 이벤트 전달

## 의존 방향

현재 직접 의존:

| 모듈                    | 직접 의존                             |
| ----------------------- | ------------------------------------- |
| ReturnsModule           | PricesModule                          |
| PricesModule            | StocksModule, MarketDataModule        |
| RealtimeModule          | StocksModule, RealtimeTradeFeedModule |
| StocksModule            | 없음                                  |
| MarketDataModule        | KIS market data module                |
| RealtimeTradeFeedModule | KIS realtime trade feed module        |

흐름:

- 결과 화면 요청은 `ReturnsModule`에서 시작해 `PricesModule`로 가격 판단을 위임한다.
- 가격 판단에는 종목 기준 데이터와 외부 시장 데이터가 필요하다.
- 실시간 가격 전달은 `RealtimeModule`에서 시작해 종목 기준 데이터와 외부 실시간 시세 연결을 사용한다.
