# 그때 샀다면

**과거에 샀던 주식이 지금 얼마가 되었을지 계산하고, 그 결과를 가볍게 공유하는 주식 회고 서비스**

[서비스 바로가기](https://ittaesalgeol.com) · [제품 문서](./PRODUCT.md) · [기술 결정 기록](./docs/adr)

## System Architecture

System Architecture

프론트엔드는 Next.js를 Cloudflare Workers에서 실행합니다. 프론트엔드 프록시는 브라우저의 API 요청에 Cloudflare Access service token을 추가해 Cloudflare Tunnel을 거쳐 백엔드 origin으로 전달합니다. AWS EC2의 백엔드 애플리케이션은 인터넷에서 직접 접근할 수 없습니다.

NestJS 백엔드는 외부 금융 데이터 REST API와 KIS WebSocket 연결을 관리합니다. 실시간 체결 정보는 백엔드에서 SSE로 변환해 클라이언트에 전달하고, 애플리케이션 로그와 운영 지표는 CloudWatch에서 수집합니다.

## Engineering Highlights

| 주제                 | 설계                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **외부 API 계약**    | KIS, 금융위원회, OpenDART의 REST API 명세는 `back/openapi/{provider}/rest/openapi.json`에서 관리하고 mock 시나리오는 `overlay.yaml`로 분리합니다. Orval은 API 호출과 응답 검증에 쓰는 `api.ts`, 개발 mock용 `api.msw.ts`, `api.scenarios.ts`를 생성합니다. |
| **내부 API 계약**    | `packages/api-client/openapi.json`은 NestJS DTO와 Zod 스키마에서 생성합니다. 이 파일로 type-safe API client를 생성합니다. 각 endpoint의 요청과 정상·오류 응답 타입을 명세에 포함하며 생성된 코드는 직접 수정하지 않습니다.                                 |
| **Error handling**   | 예상 가능한 domain error와 외부 API·WebSocket 오류는 `neverthrow`의 `Result`로 반환합니다. HTTP 응답을 만들 때 `Result`를 API 오류 응답으로 바꾸고 내부 오류는 그대로 노출하지 않습니다.                                                                   |
| **WebSocket → SSE**  | 백엔드가 외부 WebSocket의 인증, 구독, 재연결을 처리합니다. 연결 오류는 SSE로 브라우저에 전달하며 브라우저는 provider별 WebSocket 구현을 알 필요가 없습니다.                                                                                                |
| **Backend origin**   | 외부 요청은 Cloudflare가 받고, backend origin은 Cloudflare Access와 Cloudflare Tunnel을 거쳐야 접근할 수 있습니다. EC2의 backend port에는 public inbound rule을 두지 않습니다.                                                                             |
| **패키지 단위 배포** | GitHub Actions는 전체 workspace의 lint와 build를 한 번 실행한 뒤 Turborepo `affected` 결과에 포함된 `front` 또는 `back`만 배포합니다.                                                                                                                      |
| **Observability**    | Request ID를 response header와 JSON log에 함께 기록합니다. CloudWatch는 로그와 EC2 resource metric, 5xx metric을 수집하고 CloudWatch Alarm은 SNS로 알림을 보냅니다.                                                                                        |

## Infrastructure & Deployment

CI/CD Pipeline

`main` 브랜치에 push하면 GitHub Actions가 전체 workspace의 lint와 build를 실행한 뒤 Turborepo `affected`로 배포 대상을 정합니다. 프론트엔드는 OpenNext로 Cloudflare Workers에 배포합니다. 백엔드는 ARM64 Docker image를 ECR에 push하고 CodeDeploy는 ECR image를 digest로 지정해 EC2 container를 교체합니다.

## Tech Stack

| 영역               | 기술                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| **Frontend**       | TypeScript, Next.js 16, React 19, TanStack Query, Tailwind CSS 4, Zod |
| **Backend**        | TypeScript, NestJS 11, RxJS, Zod, neverthrow                          |
| **Realtime**       | WebSocket, Server-Sent Events                                         |
| **API Contract**   | OpenAPI, OpenAPI Overlay, Swagger, Orval, generated type-safe client  |
| **Workspace**      | pnpm Workspace, Turborepo                                             |
| **Testing**        | Vitest, Playwright, MSW                                               |
| **Infrastructure** | Cloudflare Workers, Access, Tunnel, AWS EC2, ECR, CodeDeploy, Docker  |
| **Observability**  | CloudWatch Logs, Metrics, Alarms, SNS                                 |
| **CI/CD**          | GitHub Actions, Turborepo Affected                                    |

## Technical Decisions

- [외부 시장 데이터 공급자를 도메인 경계 밖으로 분리](./docs/adr/0001-market-data-provider-boundary.md)
- [예상 가능한 실패를 공개 API 오류 계약으로 모델링](./docs/adr/0002-public-api-error-contract.md)
- [OpenAPI에 오류 코드별 구체적인 스키마 생성](./docs/adr/0005-openapi-code-specific-error-schemas.md)
- [Cloudflare와 AWS의 런타임 및 보안 경계 분리](./docs/adr/0006-cloudflare-aws-deployment-boundary.md)
- [외부 REST 계약의 단일 기준 정의](./docs/adr/0007-external-rest-contract-source.md)
