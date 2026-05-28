## Project Structure

```text
front/
├── src/
│   ├── app/
│   │   ├── api/[...path]/     # API proxy route
│   │   └── (stock-return)/    # route group
│   ├── components/            # shared UI
│   ├── queries/               # API client wrappers, queryOptions
│   │   └── generated/         # OpenAPI generated API surface
│   ├── server/                # server-only helpers
│   └── utils/                 # shared utilities
├── public/                    # static assets
├── docs/
└── Dockerfile
```

Route UI는 `src/app/`의 해당 route group에 둔다. 공용 UI는
`src/components/`, API 사용부는 `src/queries/`를 먼저 확인한다.

## Stack

- Language: `TypeScript`
- Framework: `Next.js 16`, `React 19`
- Data Fetching: `@tanstack/react-query`, `ky`
- URL State: `nuqs`
- Utilities: `es-toolkit`
- Schema: `zod`
- Styling: `Tailwind CSS 4`, `tailwind-variants`
- UI Primitives / Icons: `radix-ui`, `lucide-react`

## Next.js

- Next.js 기준은 설치된 `next@16`이다.
- Next.js API와 file convention은 `node_modules/next/dist/docs/`의 로컬 문서를
  기준으로 판단한다.

## API Layer

- HTTP client는 `src/queries/api.ts`의 `api` 인스턴스를 사용한다.
- Proxy route는 `src/app/api/[...path]/route.ts`다.
- 브라우저 호출 URL: `/api`
- 서버 렌더링 호출 URL: `${APP_ORIGIN}/api`
- Proxy target URL: `API_BASE_URL`
- API 에러 디버깅 순서:
  1. 호출 위치가 브라우저인지 서버인지 확인한다.
  2. 서버 호출이면 `APP_ORIGIN`을 확인한다.
  3. proxy target인 `API_BASE_URL`을 확인한다.
  4. proxy route 응답과 백엔드 원 응답을 확인한다.
  5. `ApiError` 변환 결과를 확인한다.
- Generated API surface는 `src/queries/generated/index.ts`에서 import한다.
- React Query가 필요한 API는 `src/queries/*.ts`에서 `queryOptions` API로 선언한다.
- 화면 컴포넌트는 generated 함수를 직접 호출하지 말고 `queryOptions` 선언을
  사용한다.

## Utilities

- 배열, 객체, collection 처리에는 `es-toolkit`을 우선 사용한다.
- 직접 utility를 새로 만들기 전에 `es-toolkit`에 같은 기능이 있는지 확인한다.

## UI

- Tailwind theme token은 `src/app/globals.css`의 `@theme`에서 정의한다.
- 색상, spacing, radius, shadow, typography는 theme token을 우선 사용한다.
- 임의 hex color, 임의 px 값, 일회성 Tailwind arbitrary value를 먼저 만들지
  않는다.
- Tailwind 사용 오류와 token 위반은 ESLint가 잡는다. `pnpm --filter front lint`
  결과를 기준으로 고친다.
- className 조합은 `src/utils/cn.ts`의 `cn()`을 사용한다.

## Commands

- `pnpm --filter front dev`: 개발 서버 실행
- `pnpm --filter front build`: 프로덕션 빌드
- `pnpm --filter front lint`: ESLint 실행
- `pnpm --filter front format`: Prettier 실행
