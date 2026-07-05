# Active Context

Last updated: 2026-07-05

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
- 2026-07-02 main Deploy run에서 ECR push 권한 누락은 수정됐고, 다음 실패는
  `aws deploy push` 내부의 CodeDeploy revision 등록 권한 누락이었습니다.
  GitHub Actions deploy role policy에 `codedeploy:RegisterApplicationRevision`을
  추가했고, `codedeploy:GetDeployment` resource도 CodeDeploy service authorization에
  맞게 deployment group ARN으로 정정했습니다.
- 2026-07-02 다음 main Deploy run은 ECR push와 CodeDeploy revision 등록을 통과했고,
  `create-deployment` 중 `CodeDeployDefault.OneAtATime` deployment config 조회 권한이
  없어 실패했습니다. GitHub Actions deploy role policy에
  `codedeploy:GetDeploymentConfig`를 해당 deployment config ARN으로 추가했습니다.
- 2026-07-02 다음 main Deploy run은 CodeDeploy deployment 생성까지 통과했지만,
  EC2 `ApplicationStart` hook에서 Parameter Store path 조회가 실패했습니다. EC2 role
  `trading-back-ec2`에 `/trading/prod/back/*`만 허용되어 있었고 AWS가 base path
  `/trading/prod/back` ARN도 검사했습니다. EC2 role policy에 base path ARN을 추가했고,
  SSM Run Command로 값 출력 없이 parameter count 조회가 성공함을 확인했습니다.
- 2026-07-02 EC2 role policy 변경 뒤에도 다음 CodeDeploy run은 같은 SSM 권한 오류로
  실패했습니다. 실제 role policy와 SSM Run Command 조회는 성공했기 때문에
  CodeDeploy agent를 재시작했고, 실패한 deployment archive의 `deploy.mjs`를 EC2에서
  직접 실행해 SSM read, ECR pull, Docker run이 성공함을 확인했습니다.
- 2026-07-02 container는 떠 있었지만 host loopback `/health`는 empty reply였습니다.
  원인은 Parameter Store `HOST=127.0.0.1`로 앱이 container 내부 loopback에만 bind된
  것이었습니다. `/trading/prod/back/HOST`를 `0.0.0.0`으로 갱신했고, 같은 deploy hook
  재실행 후 host `127.0.0.1:4000/health`가 200을 반환했습니다.
- 2026-07-03 main Deploy run `28601160820`이 성공했습니다. CodeDeploy deployment
  `d-284QF9FGJ`가 성공했고, EC2 내부 `http://127.0.0.1:4000/health`가 200을
  반환했습니다. Running image digest는
  `sha256:e5c041449ad4c63ff37a79cc3895b44bc7f11876fd3ab27e21b5651ab1a0a46c`입니다.
- 2026-07-04 Cloudflare Tunnel route가 `api.ittaesalgeol.com`에서
  `http://127.0.0.1:4000`으로 내려오는 것을 확인했습니다. 초기 외부 요청은 502였고,
  원인은 `cloudflared` container가 Docker bridge network에서 실행되어
  `127.0.0.1`이 EC2 host loopback이 아니라 container loopback을 가리킨 점이었습니다.
  `trading-cloudflared`를 `--network host`로 재실행한 뒤
  `https://api.ittaesalgeol.com/health`가 200을 반환했습니다.
- 2026-07-04 Cloudflare Access Service Auth가 적용됐습니다. 헤더 없는
  `https://api.ittaesalgeol.com/health` 요청과 fake `CF-Access-*` header 요청은 모두
  `HTTP/2 403`을 반환했고, 응답에는 `cf-access-domain: api.ittaesalgeol.com`이
  포함됐습니다.
- 2026-07-04 `front/.env.development`의 Cloudflare Access service token 값을
  `dotenv`로 읽어 검증했습니다. env key는 front 코드가 기대하는
  `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` 이름으로 정리했고, 해당 값으로
  `https://api.ittaesalgeol.com/health`를 호출하면 200을 반환합니다. secret 값은
  기록하지 않았습니다.
- 2026-07-04 `trading-front` Cloudflare Worker를 배포했습니다. OpenNext build가
  통과했고, Worker version `5993e2b3-aa60-4970-98ac-6ccb4eebd2ac`가 100% traffic에
  배포됐습니다. Worker secrets에는 `API_BASE_URL`, `APP_ORIGIN`,
  `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`가 설정됐습니다.
- 2026-07-04 `front/wrangler.jsonc`는 `ittaesalgeol.com/*` Worker route를 사용하도록
  정리했습니다. Custom domain 방식은 Cloudflare API의 domain record 생성 단계에서
  실패했고, route 방식 배포는 성공했습니다.
- 2026-07-04 apex `ittaesalgeol.com` DNS record를 Cloudflare proxied로 전환한 뒤
  `https://ittaesalgeol.com`과 `https://ittaesalgeol.com/api/health`가 모두 Worker를
  통해 200을 반환했습니다. 응답에는 `server: cloudflare`와 `x-opennext: 1`이
  포함됐습니다.
- 2026-07-04 `/result` 흐름은 front/Worker/Access/Tunnel 문제가 아니라 back의
  `/returns`가 KIS REST 인증 endpoint에 연결하지 못해 502를 반환하는 상태입니다.
  AWS SSM의 `KIS_REST_BASE_URL`은 `https://openapi.koreainvestment.com:9443`로
  설정돼 있고, EC2와 로컬 모두 해당 endpoint TCP 연결이 실패합니다. 같은 시각
  한국투자증권 점검 페이지는 2026-07-04 08:00부터 2026-07-05 12:00까지 모든
  금융서비스 일시 중단을 안내합니다.
- 2026-07-04 로컬에는 Cloudflare API credential이 없습니다. `CLOUDFLARE_API_TOKEN`과
  `CLOUDFLARE_ACCOUNT_ID`는 unset이고, `front`의 `wrangler whoami`는 auth token 만료로
  실패했습니다. Cloudflare Access 생성과 Workers 배포에는 Cloudflare API token 또는
  재로그인이 필요합니다.
- 2026-07-05 Deploy workflow에 PR label 기반 강제 배포 override를 추가했습니다.
  `turbo query affected --packages back front` 결과를 기본값으로 쓰고, merged PR에
  `deploy:front`, `deploy:back`, `deploy:all` label이 있으면 해당 platform 배포를
  강제합니다. `deploy:skip`은 만들지 않았습니다. workflow token에는 PR label 조회를 위한
  `pull-requests: read`만 추가했습니다.

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
- AWS/Cloudflare migration을 이어갈 때는 정적 Cloudflare Pages로 바로 가지 말고
  Workers/OpenNext 경로를 유지합니다. `/api` proxy는 별도 Worker로 분리하지 않고
  현재 Next.js route handler를 유지합니다. back application code에는 custom header
  guard를 넣지 않습니다. back origin 값은 repo/config에 실제 값으로 박지 않고 배포
  환경에서 주입합니다. deploy workflow는 `turbo query affected` JSON output으로
  `back`/`front` 영향을 판단하고, 실제 platform 배포는 repo-local composite action
  `.github/actions/deploy-back`과 `.github/actions/deploy-front`에 모읍니다. workflow는
  `prepare:api`를 직접 호출하지 않고 기존 `pnpm build` script가 API generated output을
  갱신한 뒤 deploy 대상만 한 번 계산합니다. 강제 배포가 필요하면 PR에
  `deploy:front`, `deploy:back`, `deploy:all` 중 하나를 붙입니다.
