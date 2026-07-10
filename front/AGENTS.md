## 프로젝트 구조

```text
front/
├── src/
│   ├── app/
│   │   ├── api/[...path]/     # API 프록시 라우트
│   │   └── (stock-return)/    # 라우트 그룹
│   ├── components/            # 공용 UI
│   ├── queries/               # API 클라이언트 wrapper, queryOptions
│   │   └── generated/         # OpenAPI 기반 생성 API
│   ├── server/                # 서버 전용 helper
│   └── utils/                 # 공용 유틸리티
├── public/                    # 정적 asset
├── docs/
└── Dockerfile
```

라우트 UI는 `src/app/`의 해당 route group에 둔다. 공용 UI는
`src/components/`, API 사용부는 `src/queries/`를 먼저 확인한다.

## 기술 스택

| 영역         | 기준                                  |
| ------------ | ------------------------------------- |
| 언어         | `TypeScript`                          |
| 프레임워크   | `Next.js 16`, `React 19`              |
| 데이터 조회  | `@tanstack/react-query`, `ky`         |
| URL 상태     | `nuqs`                                |
| 유틸리티     | `es-toolkit`                          |
| 스키마       | `zod`                                 |
| 스타일       | `Tailwind CSS 4`, `tailwind-variants` |
| UI 기반 요소 | `radix-ui`, `lucide-react`            |

## Next.js

- Next.js 기준은 설치된 `next@16`이다.
- Next.js API와 파일 convention은 `node_modules/next/dist/docs/`의 로컬 문서를
  기준으로 판단한다.

## API 계층

- HTTP client는 `src/queries/api.ts`의 `api` 인스턴스를 사용한다.
- 프록시 라우트는 `src/app/api/[...path]/route.ts`다.
- 브라우저 호출 URL은 `/api`다.
- 서버 렌더링 호출 URL은 `${APP_ORIGIN}/api`다.
- 프록시 대상 URL은 `API_BASE_URL`이다.
- API 에러는 아래 순서로 확인한다.
  1. 호출 위치가 브라우저인지 서버인지 확인한다.
  2. 서버 호출이면 `APP_ORIGIN`을 확인한다.
  3. 프록시 대상인 `API_BASE_URL`을 확인한다.
  4. 프록시 라우트 응답과 백엔드 원 응답을 확인한다.
  5. 백엔드 오류 응답이 타입 있는 실패값으로 변환되는지 확인한다.
- 생성 API는 `src/queries/generated/index.ts`에서 import한다.
- 생성 API는 성공과 예상 실패를 `neverthrow` 결과로 반환한다.
- API 실패를 처리할 때는 생성된 실패값을 유지하고, 일반 `Error`나 문자열로 바꾸지
  않는다.
- React Query가 필요한 API는 `src/queries/*.ts`에서 `queryOptions` API로 선언한다.
- 화면 컴포넌트는 생성 함수를 직접 호출하지 말고 `queryOptions` 선언을
  사용한다.

## 유틸리티

- 배열, 객체, collection 처리에는 `es-toolkit`을 우선 사용한다.
- 직접 utility를 새로 만들기 전에 `es-toolkit`에 같은 기능이 있는지 확인한다.

## UI

- Tailwind theme token은 `src/app/globals.css`의 `@theme`에서 정의한다.
- 색상, spacing, radius, typography는 theme token을 우선 사용한다.
- 임의 hex color, 임의 px 값, 일회성 Tailwind arbitrary value를 먼저 만들지
  않는다.
- Tailwind 사용 오류와 token 위반은 ESLint가 잡는다. `pnpm --filter front lint`
  결과를 기준으로 고친다.
- className 조합은 `src/utils/cn.ts`의 `cn()`을 사용한다.

## 접근성

- 무분별한 ARIA 속성 사용과 검증되지 않은 HTML 태그 사용을 지양한다.
- 접근성을 위해 선택한 태그와 ARIA 속성이 브라우저, OS, 보조기술 조합에 따라
  실제 동작이 달라져 오히려 UX를 방해할 수 있음을 고려한다.
- role, state, keyboard interaction, focus management 등 구현 지침이 문서화된
  패턴은 해당 지침의 의도를 설명한 뒤 적용한다.
- 모든 요소에 기계적으로 `aria-label`을 붙이거나, 의미가 불분명한 시맨틱 태그를
  접근성 개선처럼 사용하지 않는다.

## React 19

- 현재 React 19를 사용하므로 함수 컴포넌트에서 `ref`를 prop으로 받을 수 있다.
- 새 코드에서는 `forwardRef`, `ComponentPropsWithRef`, `ElementRef`,
  `ComponentRef`를 사용하지 않는다.

## 명령어

- `pnpm --filter front dev`: 개발 서버 실행
- `pnpm --filter front build`: 프로덕션 빌드
- `pnpm --filter front lint`: ESLint 실행
- `pnpm --filter front format`: Prettier 실행
