## Domain

- 이 패키지는 주식 관련 백엔드 로직을 다룬다.
- 주식 데이터는
  [KIS Developers 한국투자 Open API](https://apiportal.koreainvestment.com/)를
  활용한다.
- KIS 연동 작업 전에는 공식 Open API spec과 이 저장소의 KIS 문서를 함께 확인한다.

## Project Structure

```text
back/
├── src/
│   ├── bootstrap/       # 앱 부트스트랩, Swagger/OpenAPI 설정
│   ├── common/          # 공통 응답, validation, shared schema
│   ├── config/          # 환경 변수 validation
│   ├── health/
│   ├── kis/
│   ├── realtime/
│   ├── returns/
│   └── stocks/
├── test/
│   ├── e2e/             # HTTP/SSE e2e tests
│   └── support/         # e2e fixture, KIS mock server
├── docs/
│   ├── api.md           # 프론트 연동용 API 요약
│   ├── openapi.json     # 생성된 OpenAPI 문서
│   └── kis/             # KIS API 사용 문서
└── scripts/             # OpenAPI/클라이언트 생성, dev mock
```

Feature modules:

- `health/`: health endpoint
- `kis/`: KIS REST/WebSocket 연동, mapper, schema
- `realtime/`: 실시간 구독, SSE, WebSocket feed 처리
- `returns/`: 수익률 계산과 관련 API
- `stocks/`: 종목 검색, 현재가, 일별 가격 API

## Stack

- Language: `TypeScript`
- Framework: `NestJS 11`
- HTTP: `Nest Express adapter`
- Validation / DTO: `Zod`, `nestjs-zod`
- Utilities: `es-toolkit`
- API Docs: `@nestjs/swagger`, `swagger-ui-express`
- Realtime: WebSocket (`ws`), SSE (Server-Sent Events)
- Test: `Vitest`, `MSW`, local WebSocket mock server

## Utilities

- 배열, 객체, collection 처리에는 `es-toolkit`을 우선 사용한다.
- 직접 utility를 새로 만들기 전에 `es-toolkit`에 같은 기능이 있는지 확인한다.

## API Contract Source

- API 계약 작업 전에는 해당 기능의 `*.controller.ts`, `*.dto.ts`,
  `*.schema.ts`를 함께 읽는다.
- `*.dto.ts`는 OpenAPI가 읽는 DTO class의 위치다.
  - 예: 주식 API는 `back/src/stocks/stocks.dto.ts`
- `*.schema.ts`는 실제 필드, 타입, nullable, validation, example의 기준이다.
  - 예: 주식 API는 `back/src/stocks/stock.schema.ts`
- controller의 `@Param()`, `@Query()`, request body, return type에 연결된 DTO가
  request/response schema가 된다.
- 일반 HTTP API에는 Swagger annotation을 직접 추가하지 않는다.
- SSE나 WebSocket처럼 자동 생성이 부족한 계약에만 필요한 annotation을 직접
  추가한다.

## OpenAPI Output

- `nest-cli.json`은 `@nestjs/swagger` compiler plugin을 사용한다.
- `back/scripts/generate-openapi.ts`가 `back/docs/openapi.json`을 생성한다.
- `back/docs/openapi.json`은 직접 손으로 고치지 않는다.
- API 계약이 바뀌면 schema/DTO/controller를 먼저 고치고 OpenAPI JSON을 다시
  생성한다.
- 프론트 생성 클라이언트는 `back/docs/openapi.json`을 입력으로 사용한다.
- 계약 변경 시 프론트 생성 코드도 함께 갱신한다.

## KIS Integration

- KIS 호출은 호출량, 인증 토큰, WebSocket 승인키 발급 제한을 고려한다.
- 같은 데이터를 짧은 시간에 반복 조회하지 않는다.
- 인증 토큰이나 WebSocket 승인키를 불필요하게 반복 발급하지 않는다.
- KIS 응답은 시장 운영 시간, 비거래일, 외부 장애, 데이터 지연의 영향을 받을 수
  있다.
- 실시간 연결은 장시간 유지되는 자원이다.
- 구독 추가/해제, 재연결, heartbeat, 장애 전파가 어긋나지 않게 처리한다.
- KIS API를 다룰 때는 `back/docs/kis/` 문서를 먼저 확인한다.
- 로컬 문서와 공식 spec이 다르면 공식 spec을 기준으로 판단한다.

## Testing

- 백엔드 테스트는 Vitest를 사용한다.
- 단위 테스트는 `back/src/**/*.spec.ts`에 둔다.
- e2e 테스트는 `back/test/e2e/**/*.spec.ts`에 둔다.
- 단일 서비스의 계산, 캐시, 예외, 재시도, mapper 로직은 단위 테스트로 검증한다.
- HTTP API 흐름, Nest wiring, validation, 응답 형태, SSE/WebSocket 연동은 e2e로
  검증한다.
- 테스트에서 실제 KIS 운영 API를 호출하지 않는다.
- KIS REST API는 MSW로 대체한다.
- KIS WebSocket은 테스트용 로컬 서버로 대체한다.
- 테스트는 실제 KIS 인증키에 의존하지 않는다.

### Test Names

- 테스트 이름은 개발자 이외의 팀원(PM, PO 등)이 봐도 이해할 수 있는 행위
  중심의 문장으로 작성한다.
- 테스트 이름만 보고 어떤 사용자 시나리오에서 어떤 결과를 기대하는지 알 수
  있어야 한다.
- 구현 세부사항, 내부 함수명, 라이브러리명, 임시 변수명은 테스트 이름에 넣지
  않는다.
- 테스트 이름은 샘플 입력값보다 그 입력값이 검증하는 규칙을 설명한다.
- 좋은 테스트 이름은 CLI의 test name filter로 골라 실행할 수 있을 만큼 안정적인
  행위 표현이어야 한다.

## Commands

- `pnpm --filter back build`: 백엔드 컴파일
- `pnpm --filter back start:dev`: 개발 서버 실행
- `pnpm --filter back start:mock`: mock 엔트리로 개발 서버 실행
- `pnpm --filter back test`: 단위 테스트
- `pnpm --filter back test:e2e`: e2e 테스트
- `pnpm --filter back test:cov`: 커버리지 확인
