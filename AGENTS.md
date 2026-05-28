# 저장소 작업 가이드

## 프로젝트 구조

이 저장소는 pnpm workspace 기반 모노레포이며, 패키지는 서로 독립적으로 다룹니다.

- `front/`: Next.js 클라이언트입니다.
  - 주요 코드는 `front/src`, 공용 UI는 `front/src/components`에 있습니다.
  - 정적 파일은 `front/public`, 생성된 API 클라이언트는
    `front/src/queries/generated`에 있습니다.
- `back/`: NestJS 서버입니다.
  - 주요 코드는 `back/src`, 작업용 스크립트는 `back/scripts`에 있습니다.
  - 테스트는 `back/test/e2e`와 `back/test`, 문서는 `back/docs`에 있습니다.

## 개발·빌드·테스트 명령

명령은 저장소 루트에서 workspace filter로 실행합니다.

- 프론트:
  - `pnpm --filter front dev`: 개발 서버를 실행합니다.
  - `pnpm --filter front build`: 프로덕션 빌드를 만듭니다.
  - `pnpm --filter front lint`: ESLint를 실행합니다.
- 백엔드:
  - `pnpm --filter back start:dev`: watch 모드로 실행합니다.
  - `pnpm --filter back build`: 컴파일합니다.
  - `pnpm --filter back test`: Vitest 단위 테스트를 실행합니다.
  - `pnpm --filter back test:e2e`: e2e 테스트를 직렬로 실행합니다.
  - `pnpm --filter back test:cov`: 테스트 커버리지를 확인합니다.

## 테스트 기준

- 백엔드 테스트는 Vitest를 사용합니다.
  - 단위 테스트는 구현 코드 옆의 `back/src/**/*.spec.ts`에 둡니다.
  - API 흐름을 검증하는 테스트는 `back/test/e2e`에 둡니다.
  - 비즈니스 로직, 검증 규칙, KIS 매핑, 실시간 구독, API 계약을 바꾸면 관련
    테스트를 함께 추가하거나 수정합니다.

## 에이전트 작업 규칙

- `front`와 `back`은 독립 패키지로 취급합니다.
- 한 패키지 안의 문제를 해결하려고 다른 패키지를 임의로 탐색하거나 수정하지
  않습니다.
- 작업상 필요하면 먼저 교차 패키지 변경이 필요한 이유를 제안합니다.
