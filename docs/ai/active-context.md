# Active Context

Last updated: 2026-07-02

## Current Focus

- AI 기반 프로젝트 운영 체계 1차 구성이 완료되었습니다.
- Codex는 이 저장소에서 단순 질의나 아주 작은 수정이 아닌 작업을 할 때
  `project-operating-system` skill과 `docs/ai/` 기록 루프를 사용해야 합니다.
- 사람이 프로젝트 맥락을 확인할 때는 `docs/ai/START_HERE.md`에서 시작합니다.
- 2026-06-24에는 `a.txt` 요청에 따라 `back` 패키지의 KIS OpenAPI 호출부,
  MSW mock 경계, Port/Adapter 결합도 변화를 분석했습니다. 결과는
  `docs/ai/tasks/TASK-0004-backend-kis-integration-analysis.md`에 남겼습니다.
- 2026-06-25 main 배포 장애 분석은
  `docs/ai/research/2026-06-26-deploy-failure-response.md`와
  `docs/ai/tasks/TASK-0005-deploy-failure-response.md`에 남겼습니다. 핵심
  후속 작업은 PR CI에 back test/front build를 추가하고, Deploy workflow를
  front/back 독립 job으로 분리하며, manual deploy path와 production image smoke
  test를 추가하는 것입니다.
- 2026-06-27에는 API 계약 artifact와 client generator 책임을
  `packages/api-client`로 분리했습니다. `back`은
  `packages/api-client/openapi.json` 생성만 맡고, `front`는
  `api-client generate front`로 `src/queries/generated/`를 생성합니다.
- 2026-06-30에는 신입 풀스택 이력서에 사용할 프로젝트 강조 포인트를
  `back`, `front`, repo-wide/DevOps 서브에이전트 탐색으로 정리했습니다. 결과는
  `docs/ai/tasks/TASK-0007-resume-evidence-mining.md`에 남겼습니다.
- 2026-07-02에는 GCP Cloud Run 무료 구간 종료 대응으로 AWS EC2 + Cloudflare
  migration 방향을 정리했습니다. 결정된 back 구조는 EC2 `t4g.micro` + Docker +
  ECR + CodeDeploy + Cloudflare Tunnel이고, front는 현재 Next.js server 기능 때문에
  정적 Cloudflare Pages가 아니라 Cloudflare Workers/OpenNext를 1차 target으로 둡니다.
  상세는 `docs/ai/research/2026-07-02-aws-ec2-cloudflare-migration.md`와
  `docs/ai/tasks/TASK-0008-aws-ec2-cloudflare-migration.md`에 있습니다.
- 2026-07-02 `front` OpenNext spike는 통과했습니다. `/api` proxy는 유지하되 Google
  ID token 발급을 제거하고, Worker env의 Cloudflare Access service token header를
  붙이는 구조로 변경했습니다.
- 2026-07-02 back CodeDeploy wiring을 추가했습니다. `.github/workflows/deploy.yml`은
  AWS OIDC, ECR arm64 image push, S3 revision upload, CodeDeploy deployment 생성
  흐름으로 바뀌었습니다. EC2 hook은 `deploy/codedeploy/deploy.mjs`이고, GitHub 쪽
  CodeDeploy 호출은 `scripts/deploy/create-codedeploy-deployment.mjs`가 AWS CLI로
  수행합니다.
- 2026-07-02 Cloudflare Access Service Auth runbook을 추가했습니다. Cloudflare
  protected application, Service Auth policy, service token 보관 위치, direct
  `BACK_API_ORIGIN` 차단 검증 기준을 정리했습니다. 실제 Cloudflare 계정 설정은 아직
  실행하지 않았습니다.
- 2026-07-02 AWS bootstrap runbook과 IAM draft를 추가했습니다. `deploy/aws/README.md`는
  IAM, ECR, S3, CodeDeploy, EC2, Parameter Store 준비 순서와 GitHub Actions vars를
  정의하고, `deploy/aws/iam/*.json`은 GitHub OIDC role, EC2 instance role,
  CodeDeploy service role 초안을 담습니다. 실제 AWS 리소스 생성 명령은 실행하지
  않았습니다.
- 2026-07-02 read-only AWS CLI 조회 결과, 서울 리전 `ap-northeast-2`에는 VPC,
  subnet, route table, internet gateway가 없습니다. AWS bootstrap은 기존 VPC 선택이
  아니라 새 `trading-prod` VPC networking 생성부터 시작해야 합니다.
- 2026-07-02 승인 후 AWS CLI로 `trading-prod` VPC networking을 생성했습니다. 생성 범위는
  VPC, Internet Gateway, public subnet, route table, inbound empty security group입니다.
  이 단계에서는 IAM, ECR, S3, CodeDeploy, EC2를 만들지 않았습니다.
- 2026-07-02 승인 후 AWS CLI로 IAM deploy 기반을 생성했습니다. 범위는 GitHub Actions
  OIDC deploy role, EC2 instance role/profile, CodeDeploy service role입니다. GitHub
  Actions trust는 `whdgur5717/trading` `main` branch로 제한되어 있음을 확인했습니다.
  이 단계에서는 ECR, S3, CodeDeploy, EC2를 만들지 않았습니다.
- 2026-07-02 승인 후 AWS CLI로 ECR repository `trading-back`과 CodeDeploy artifact
  S3 bucket을 생성했습니다. ECR은 immutable tag, scan on push, AES256, latest 30
  images lifecycle이고, S3는 public access block, versioning, AES256 encryption,
  artifact lifecycle이 설정되어 있습니다.
- 2026-07-02 승인 후 AWS CLI로 CodeDeploy application `trading-back`과 deployment
  group `trading-back-prod`를 생성했습니다. deployment group은 EC2 tag
  `CodeDeployGroup=trading-back-prod`, `CodeDeployDefault.OneAtATime`,
  `DEPLOYMENT_FAILURE` auto rollback 기준입니다.
- 2026-07-02 승인 후 AWS CLI로 production back EC2 `i-0e5c27c2b9180198b`를 생성했습니다.
  Instance type은 `t4g.micro`, OS는 Amazon Linux 2023 ARM64, instance profile은
  `trading-back-ec2`, security group inbound는 empty입니다. EC2 status checks는 `ok`,
  SSM managed instance 상태는 `Online`입니다. 다음 단계는 EC2 host bootstrap입니다.
- 2026-07-02 승인 후 SSM Run Command로 EC2 host bootstrap을 완료했습니다. Docker,
  Node.js 20, Ruby, wget, CodeDeploy agent를 설치했고 `/opt/trading/back`을 root-only
  directory로 준비했습니다. Docker와 CodeDeploy agent는 `active`/`enabled`입니다. 앱
  container와 Cloudflare Tunnel은 아직 설정하지 않았습니다.
- 2026-07-02 승인 후 EC2 host Node.js를 Node.js official Linux ARM64 tarball 기반
  `v24.18.0`으로 올렸습니다. `/usr/bin/node`는
  `/usr/local/lib/nodejs/node-v24.18.0-linux-arm64/bin/node`를 가리키고, npm/npx는
  `11.16.0`입니다.
- 2026-07-02 잘못 추가했던 SSM 일괄 등록 script는 제거했습니다. Back runtime
  env는 GitHub Actions나 repo script가 보관/검증하지 않고, AWS SSM Parameter Store
  SecureString에서 직접 관리합니다. 필요한 env 여부는 back app startup validation이
  판단합니다.
- 2026-07-02 `gh` CLI로 GitHub Actions AWS deploy repository variables를 설정했습니다.
  기존 GCP variables는 아직 repository에 남아 있지만, 현재 AWS deploy workflow는
  `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `ECR_REGISTRY`, `ECR_BACK_REPOSITORY`,
  `CODEDEPLOY_ARTIFACT_BUCKET`, `CODEDEPLOY_APPLICATION_NAME`,
  `CODEDEPLOY_DEPLOYMENT_GROUP_NAME`를 사용합니다.

## Working Agreements

- 제품/문구/기획 작업은 `PRODUCT.md`를 먼저 확인합니다.
- UI/스타일/컴포넌트/레이아웃 작업은 `DESIGN.md`를 먼저 확인합니다.
- `front`와 `back`은 독립 패키지로 다루며, 교차 변경이 필요하면 이유를 먼저
  밝힙니다.
- 큰 작업은 `docs/ai/tasks/`에 작업 파일을 만들거나 갱신합니다.
- 기능 맥락과 수용 기준은 `docs/ai/features/`에 남깁니다.
- 디자인 적용 판단은 `docs/ai/design/`에 남깁니다.
- 중요한 제품/디자인/기술 결정은 `docs/ai/decisions/`에 남깁니다.

## Next Actions

- 새 작업이 시작되면 `progress.md`와 `tasks/_index.md`를 함께 확인합니다.
- 작업 종료 전 변경된 맥락을 이 파일과 관련 작업 파일에 반영합니다.
- 기록 누락이 반복되면 `.codex/hooks` 기반 종료 검사 추가를 검토합니다.
- KIS approval key 캐시 여부를 설명하거나 수정할 때는 로컬
  `back/docs/kis/openapi-usage.md`의 23시간 캐시 설명과 현재
  `AuthorizationProvider.approvalKey()` 구현이 불일치한다는 점을 먼저 확인합니다.
- 배포 장애를 다룰 때는 Cloud Run `PORT=8080` 메시지만 보고 판단하지 말고,
  해당 revision stderr를 먼저 확인합니다. Cloud Run/IAM/traffic 변경은 실행 전
  대상 service, image/revision, 새 revision 생성 여부, rollback을 명시하고
  승인을 받습니다.
- API 계약 변경을 다룰 때는 `pnpm build` 또는 `pnpm type-check`의 Turbo 그래프가
  `back:type-check` -> `//:generate:openapi` -> `front:generate:api` ->
  `front:type-check` 순서를 보장하는지 확인합니다.
- AWS/Cloudflare migration 구현을 시작할 때는 정적 Cloudflare Pages로 바로 가지
  말고 Workers/OpenNext 경로를 유지합니다. `/api` proxy는 별도 Worker로 분리하지
  않고 현재 Next.js route handler를 유지합니다. back application code에는 custom
  header guard를 넣지 않습니다. back origin 값은 repo/config에 실제 값으로 박지 않고
  배포 환경에서 주입합니다. 다음 구현 단계는 Cloudflare Access protected application
  실제 생성/검증, 첫 back deployment, Cloudflare Workers front deploy step 추가입니다.
