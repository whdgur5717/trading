# TASK-0008: AWS EC2 + Cloudflare migration

Status: In progress; front/back runtime path verified, CI automation pending
Last updated: 2026-07-04

## Goal

GCP Cloud Run 배포를 AWS EC2 + Cloudflare 기반 배포로 이전하기 위한 확정 결정,
남은 검증 항목, 구현 순서를 기록합니다.

## Scope

- In: AWS EC2, ECR, CodeDeploy, Cloudflare Workers/OpenNext, Cloudflare Tunnel,
  Parameter Store, GitHub Actions OIDC, Docker image 배포, rollback 설계.
- Out: secret 값 기록.

## Decisions Recorded

- `front`: Cloudflare Workers/OpenNext 배포. 정적 Cloudflare Pages 단독 배포는 현재
  Next.js server 기능 때문에 보류.
- `back`: EC2 `t4g.micro`, Docker 실행.
- Region: `ap-northeast-2`.
- Image registry: ECR.
- Deploy manager: CodeDeploy.
- Deploy workflow boundary: GitHub Actions workflow owns setup and affected branching;
  repo-local composite actions own platform deployment details.
- External access: Cloudflare Tunnel.
- Secret storage: AWS Parameter Store by path.
- EC2 inbound: 운영 기본 미개방.
- Break-glass access: AWS SSM Session Manager.
- Browser API contract: same-origin `/api/*`.
- API proxy: 현재 Next.js `/api` route handler 유지. 별도 proxy Worker로 분리하지
  않습니다.
- Backend access control: Cloudflare Access Service Auth. OpenNext front의 Next.js
  proxy service token만 `BACK_API_ORIGIN`을 통과합니다.

## Artifacts

- Research/plan: `docs/ai/research/2026-07-02-aws-ec2-cloudflare-migration.md`
- Decision: `docs/ai/decisions/2026-07-02-aws-ec2-cloudflare-deployment.md`
- Cloudflare Access runbook:
  `docs/ai/research/2026-07-02-cloudflare-access-service-auth-runbook.md`
- AWS bootstrap runbook and IAM drafts: `deploy/aws/README.md`,
  `deploy/aws/iam/*.json`
- Visual: `docs/ai/research/2026-07-02-ec2-cloudflare-architecture.html`

## Verification

- 현재 repo의 `back/Dockerfile`, `.github/workflows/deploy.yml`, 루트
  `package.json`, `turbo.json`을 확인했습니다.
- `pnpm --filter back build` 통과.
- `back` production 서버를 로컬 포트에서 임시 실행해 `/health`와
  `/stocks/suggestion` 요청 후 RSS를 확인했습니다.
- 서브에이전트 3개로 gap review, repo compatibility review, external pricing/security
  review를 수행했습니다.
- `front` OpenNext spike:
  - `pnpm --filter front type-check` 통과.
  - `pnpm --filter front build` 통과.
  - `pnpm --filter front exec opennextjs-cloudflare build` 통과.
  - OpenNext preview + local mock backend에서 `GET /api/health`가 back으로 proxy됨을
    확인했습니다.
  - client가 가짜 `CF-Access-*` header를 보내도 proxy가 제거 후 Worker env 값으로
    덮어쓰는 것을 확인했습니다.
- `back` CodeDeploy wiring:
  - `appspec.yml` 추가.
  - `deploy/codedeploy/deploy.mjs` 추가. CodeDeploy Agent가 EC2에서 실행합니다.
  - `scripts/deploy/create-codedeploy-deployment.mjs` 추가. GitHub Actions에서
    S3 revision upload와 `CreateDeploymentCommand` 실행을 담당합니다.
  - `.github/workflows/deploy.yml`을 AWS OIDC, ECR `linux/arm64` image push,
    CodeDeploy deployment 생성 흐름으로 교체했습니다.
  - 실제 AWS 리소스 생성이나 배포 실행은 하지 않았습니다.
- AWS bootstrap runbook:
  - `deploy/aws/README.md`에 AWS resource 생성 순서, EC2 bootstrap 절차, GitHub
    Actions vars, 검증 기준을 정리했습니다.
  - `deploy/aws/iam/`에 GitHub Actions OIDC role, EC2 instance role, CodeDeploy
    service role의 trust/policy JSON 초안을 추가했습니다.
  - 2026-07-02 read-only AWS CLI 조회에서 `ap-northeast-2`의 VPC, subnet, route
    table, internet gateway가 모두 0개임을 확인했습니다. 따라서 runbook은 기존
    VPC 재사용이 아니라 `trading-prod` VPC, public subnet, internet gateway, route
    table을 새로 만드는 순서로 정정했습니다.
  - 2026-07-02 승인 후 AWS CLI로 `trading-prod` VPC networking을 생성했습니다. 범위는
    VPC, Internet Gateway, public subnet, route table, inbound empty security group입니다.
    IAM, ECR, S3, CodeDeploy, EC2는 생성하지 않았습니다.
- AWS IAM setup:
  - 2026-07-02 승인 후 AWS CLI로 GitHub Actions deploy role, EC2 instance role,
    EC2 instance profile, CodeDeploy service role을 생성했습니다.
  - GitHub Actions trust policy는 `whdgur5717/trading` repo의 `main` branch와
    `sts.amazonaws.com` audience로 제한되어 있음을 확인했습니다.
  - EC2 role에는 `AmazonSSMManagedInstanceCore` managed policy와 ECR/S3/SSM inline
    policy를 붙였습니다.
  - CodeDeploy service role에는 `AWSCodeDeployRole` managed policy를 붙였습니다.
  - artifact bucket 이름은 `trading-codedeploy-<account-id>-ap-northeast-2` 패턴으로
    맞췄지만, 실제 bucket 생성은 아직 하지 않았습니다.
- AWS ECR/S3 setup:
  - 2026-07-02 승인 후 AWS CLI로 ECR repository `trading-back`과 CodeDeploy artifact
    S3 bucket을 생성했습니다.
  - ECR은 immutable tag, scan on push, AES256 encryption, latest 30 images lifecycle로
    설정했습니다.
  - S3 bucket은 public access block, versioning, AES256 encryption,
    `codedeploy/trading-back/` prefix lifecycle을 설정했습니다.
  - 이 단계에서는 CodeDeploy application/deployment group과 EC2를 만들지 않았습니다.
- AWS CodeDeploy setup:
  - 2026-07-02 승인 후 AWS CLI로 CodeDeploy application `trading-back`과 deployment
    group `trading-back-prod`를 생성했습니다.
  - deployment group은 EC2 tag `CodeDeployGroup=trading-back-prod`를 대상으로 하고,
    deployment config는 `CodeDeployDefault.OneAtATime`, auto rollback은
    `DEPLOYMENT_FAILURE`에 켜져 있습니다.
  - 생성 당시에는 EC2가 없었지만, 이후 생성한 EC2가 같은 tag를 가지고 있습니다.
- AWS EC2 setup:
  - 2026-07-02 승인 후 AWS CLI로 production back EC2를 생성했습니다.
  - Instance id는 `i-0e5c27c2b9180198b`입니다.
  - Instance type은 `t4g.micro`, AMI는 Amazon Linux 2023 ARM64입니다.
  - Instance profile은 `trading-back-ec2`이고, security group은 inbound empty입니다.
  - IMDSv2는 required, root volume은 gp3 10 GiB encrypted, delete on termination입니다.
- AWS EC2 bootstrap:
  - 2026-07-02 승인 후 SSM Run Command로 EC2 host bootstrap을 수행했습니다.
  - 설치/준비 범위는 Docker, Node.js 20, Ruby, wget, CodeDeploy agent,
    `/opt/trading/back` directory입니다.
  - 첫 SSM command는 newline escaping 문제로 설치 전 실패했고, 명령 배열 방식으로
    재실행해 성공했습니다.
  - 앱 배포, Docker container 실행, Parameter Store 값 등록, Cloudflare Tunnel 실행은
    아직 하지 않았습니다.
- AWS EC2 Node.js 24 update:
  - 2026-07-02 승인 후 SSM Run Command로 EC2 host Node.js를 Node.js official
    `latest-v24.x` Linux ARM64 tarball에서 설치했습니다.
  - SHA256 checksum 검증 후 `/usr/local/lib/nodejs`에 설치하고 system alternatives를
    Node.js 24로 전환했습니다.
  - 첫 command는 temp directory 삭제 후 그 directory에서 `npm --version`을 실행해
    실패했지만, 설치와 alternatives 전환은 완료된 상태였습니다. `/root`에서 재검증해
    성공했습니다.
  - 최종 host Node.js는 `v24.18.0`, npm/npx는 `11.16.0`입니다.
- Local verification:
  - `node --check scripts/deploy/create-codedeploy-deployment.mjs` 통과.
  - `node --check deploy/codedeploy/deploy.mjs` 통과.
  - `pnpm build` 통과.
  - `pnpm --filter front exec opennextjs-cloudflare build` 통과.
  - CodeDeploy revision push/deployment script는 AWS SDK나 zip library 없이 AWS CLI를
    호출하는 방식으로 정리했고, Node 문법 검사를 통과했습니다.
  - `git diff --check` 통과.
- AWS networking verification:
  - VPC state는 `available`입니다.
  - public subnet은 `ap-northeast-2a`, `10.0.1.0/24`, `MapPublicIpOnLaunch=true`입니다.
  - route table은 subnet에 연결되어 있고 `0.0.0.0/0 -> Internet Gateway` route가
    `active`입니다.
  - security group `trading-back-prod`의 inbound rule은 빈 배열입니다.
- AWS IAM verification:
  - GitHub Actions role trust condition은 target repo `main` branch와 `sts.amazonaws.com`
    audience입니다.
  - GitHub Actions role inline policy name은 `trading-github-actions-deploy`입니다.
  - EC2 role inline policy name은 `trading-back-ec2`이고 managed policy
    `AmazonSSMManagedInstanceCore`가 attached 상태입니다.
  - EC2 instance profile은 `trading-back-ec2` role을 포함합니다.
  - CodeDeploy service role trust principal은 `codedeploy.ap-northeast-2.amazonaws.com`이고
    managed policy `AWSCodeDeployRole`이 attached 상태입니다.
- AWS ECR/S3 verification:
  - ECR repository `trading-back`은 `IMMUTABLE`, `scanOnPush=true`, `AES256`입니다.
  - ECR lifecycle policy는 latest 30 images 보관 기준입니다.
  - S3 artifact bucket은 public access block 4개 설정이 모두 `true`, versioning
    `Enabled`, default encryption `AES256`입니다.
  - S3 lifecycle은 `codedeploy/trading-back/` prefix current objects 30일,
    noncurrent versions 7일 만료 기준입니다.
- AWS CodeDeploy verification:
  - Application `trading-back`의 compute platform은 `Server`입니다.
  - Deployment group `trading-back-prod`는 service role `trading-codedeploy-service`,
    tag filter `CodeDeployGroup=trading-back-prod`, deployment config
    `CodeDeployDefault.OneAtATime`, auto rollback `DEPLOYMENT_FAILURE` 설정입니다.
  - EC2 생성 후 `CodeDeployGroup=trading-back-prod` tag로 matching running instance가
    1개입니다.
- AWS EC2 verification:
  - Instance `i-0e5c27c2b9180198b` state는 `running`입니다.
  - EC2 system status와 instance status가 모두 `ok`입니다.
  - SSM managed instance 상태는 `Online`이고 platform은 Amazon Linux 2023입니다.
  - `CodeDeployGroup=trading-back-prod` tag로 matching running instance가 1개입니다.
  - Security group inbound rule은 빈 배열입니다.
- AWS EC2 bootstrap verification:
  - AWS CLI `2.33.15`, Node.js `20.20.2`, Docker `25.0.14`를 확인했습니다.
  - Docker service와 CodeDeploy agent service가 모두 `active`/`enabled`입니다.
  - `/opt/trading`과 `/opt/trading/back`은 `root:root`, `700`입니다.
  - `iptables` command가 존재하고 `nf_tables` backend로 동작합니다.
  - 현재 running Docker container는 없습니다.
- AWS EC2 Node.js 24 verification:
  - `/usr/bin/node`가 `/usr/local/lib/nodejs/node-v24.18.0-linux-arm64/bin/node`를
    가리킵니다.
  - `node --version`은 `v24.18.0`, npm/npx는 `11.16.0`입니다.
  - CodeDeploy agent는 `active` 상태입니다.
- Back runtime env 관리:
  - 잘못 추가했던 SSM 일괄 등록 script는 제거했습니다.
  - Back runtime secret은 GitHub Actions나 repo script에 두지 않고 AWS SSM Parameter
    Store SecureString에서 직접 관리합니다.
  - EC2 CodeDeploy hook은 `/trading/prod/back` path를 읽어 container env로 주입합니다.
  - 필요한 env 여부는 repo script가 아니라 back app startup validation이 판단합니다.
- GitHub Actions repository variables:
  - 2026-07-02 `gh variable set`으로 AWS deploy workflow에 필요한 repository
    variables를 설정했습니다.
  - 설정한 변수는 `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `ECR_REGISTRY`,
    `ECR_BACK_REPOSITORY`, `CODEDEPLOY_ARTIFACT_BUCKET`,
    `CODEDEPLOY_APPLICATION_NAME`, `CODEDEPLOY_DEPLOYMENT_GROUP_NAME`입니다.
  - 기존 GCP 관련 repository variables는 아직 남아 있지만, 현재 AWS deploy workflow는
    위 AWS variables를 사용합니다.
- First Deploy run:
  - main push 후 Deploy run은 ECR image push 단계에서 실패했습니다.
  - Docker build와 layer push는 진행됐고, manifest HEAD 확인에서 `403 Forbidden`이
    발생했습니다.
  - `trading-github-actions-deploy`에 ECR manifest/layer read 권한
    `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer`, `ecr:DescribeImages`를 추가했고
    IAM simulator에서 `allowed`를 확인했습니다.
- Second Deploy run:
  - ECR image push는 성공했습니다.
  - `Deploy back with CodeDeploy` 단계에서 `aws deploy push`가 CodeDeploy
    `RegisterApplicationRevision` 권한 누락으로 실패했습니다.
  - GitHub Actions deploy role에 `codedeploy:RegisterApplicationRevision`을 추가했습니다.
  - `codedeploy:GetDeployment`는 CodeDeploy deployment ARN이 아니라 deployment group
    ARN에 대해 허용되도록 policy를 정정했습니다.
- Third Deploy run:
  - ECR image push와 CodeDeploy revision 등록은 성공했습니다.
  - `create-deployment` 호출 중 CodeDeploy deployment config
    `CodeDeployDefault.OneAtATime` 조회 권한 누락으로 실패했습니다.
  - GitHub Actions deploy role에 `codedeploy:GetDeploymentConfig`를 해당 deployment
    config ARN으로 추가했고 IAM simulator에서 `allowed`를 확인했습니다.
- Fourth Deploy run:
  - CodeDeploy deployment 생성은 성공했습니다.
  - EC2 `ApplicationStart` hook의 `deploy/codedeploy/deploy.mjs`가 Parameter Store
    `/trading/prod/back` path를 읽을 때 EC2 role `trading-back-ec2`에 base path ARN
    권한이 없어 실패했습니다.
  - EC2 role policy에 `/trading/prod/back`과 `/trading/prod/back/*` ARN을 모두
    허용하도록 수정했습니다.
  - SSM Run Command로 secret 값을 출력하지 않고 parameter count만 조회해 EC2에서
    `/trading/prod/back` read가 성공함을 확인했습니다.
- Fifth Deploy run:
  - 같은 `ssm:GetParametersByPath` 오류로 실패했습니다.
  - 실제 EC2 role policy와 SSM Run Command 조회는 성공했기 때문에 CodeDeploy agent를
    재시작했습니다.
  - 실패한 deployment archive의 `deploy/codedeploy/deploy.mjs`를 EC2에서 직접 실행해
    SSM read, ECR pull, Docker run이 성공함을 확인했습니다.
  - host loopback `/health`가 empty reply를 반환하는 추가 문제가 있었고, 원인은
    Parameter Store `HOST=127.0.0.1`이었습니다. container 내부 process는 `0.0.0.0`에
    bind되어야 하고, host-only 노출은 Docker `127.0.0.1:<PORT>:<PORT>` publish가
    담당합니다.
  - `/trading/prod/back/HOST`를 `0.0.0.0`으로 갱신했고, 같은 deploy hook 재실행 후 host
    `127.0.0.1:4000/health`가 200을 반환했습니다.
- Sixth Deploy run:
  - GitHub Actions run `28601160820`이 성공했습니다.
  - CodeDeploy deployment `d-284QF9FGJ`가 성공했습니다.
  - EC2 내부 `http://127.0.0.1:4000/health`가 200을 반환했습니다.
  - Running back image digest는
    `sha256:e5c041449ad4c63ff37a79cc3895b44bc7f11876fd3ab27e21b5651ab1a0a46c`입니다.
- Cloudflare Tunnel route:
  - Cloudflare route config가 `api.ittaesalgeol.com`에서
    `http://127.0.0.1:4000`으로 내려오는 것을 확인했습니다.
  - 초기 외부 요청은 502였고, 원인은 `cloudflared`가 Docker bridge network에서
    실행되어 `127.0.0.1`이 EC2 host loopback이 아니라 container loopback을 가리킨
    점이었습니다.
  - `trading-cloudflared`를 `--network host`로 재실행했고,
    `cloudflared_network=host`, `running=true`, `restarts=0`을 확인했습니다.
  - 외부 `https://api.ittaesalgeol.com/health`가 200을 반환했습니다.
- Cloudflare Access Service Auth:
  - Cloudflare Access 적용 후 헤더 없는 `https://api.ittaesalgeol.com/health` 요청은
    `HTTP/2 403`을 반환했습니다.
  - fake `CF-Access-Client-Id`와 fake `CF-Access-Client-Secret` header 요청도
    `HTTP/2 403`을 반환했습니다.
  - 응답에는 `cf-access-domain: api.ittaesalgeol.com`이 포함되어 Cloudflare Access가
    back 앞에서 요청을 차단함을 확인했습니다.
- Cloudflare Access service token verification:
  - `front/.env.development`에서 `dotenv`로 `CF_ACCESS_CLIENT_ID`와
    `CF_ACCESS_CLIENT_SECRET`을 읽었습니다.
  - secret 값을 출력하지 않고 header에만 붙여
    `https://api.ittaesalgeol.com/health`를 호출했고 200을 확인했습니다.
- Cloudflare Workers front deploy:
  - `front/wrangler.jsonc`는 `ittaesalgeol.com/*` route trigger를 사용합니다.
  - `pnpm --filter front exec opennextjs-cloudflare build`가 통과했습니다.
  - `trading-front` Worker를 배포했고, version
    `5993e2b3-aa60-4970-98ac-6ccb4eebd2ac`가 100% traffic에 배포됐습니다.
  - Worker secrets에는 `API_BASE_URL`, `APP_ORIGIN`, `CF_ACCESS_CLIENT_ID`,
    `CF_ACCESS_CLIENT_SECRET`가 설정됐습니다.
  - Custom domain 방식은 Cloudflare domain record 생성 단계에서 실패했지만,
    route trigger `ittaesalgeol.com/*` 배포는 성공했습니다.
  - Apex `ittaesalgeol.com` DNS record를 Cloudflare proxied로 전환한 뒤
    `https://ittaesalgeol.com`과 `https://ittaesalgeol.com/api/health`가 모두 200을
    반환했습니다.
  - 응답에는 `server: cloudflare`와 `x-opennext: 1`이 포함되어 Worker route가 실행됨을
    확인했습니다.
- `/result` runtime check:
  - `https://ittaesalgeol.com/api/health`와 EC2 내부 `/health`는 200입니다.
  - EC2 내부 `/returns?symbol=005930&buyDate=2026-07-03&quantity=1`는 502를
    반환합니다.
  - 응답 원인은 KIS `/oauth2/tokenP` 연결 실패이며 `upstreamCode`는
    `ECONNREFUSED`입니다.
  - AWS SSM의 `KIS_REST_BASE_URL`은 공식/기존 문서와 같은
    `https://openapi.koreainvestment.com:9443`입니다.
  - 같은 시각 한국투자증권 점검 페이지는 2026-07-04 08:00부터 2026-07-05
    12:00까지 모든 금융서비스 일시 중단을 안내합니다. 점검 종료 후 같은
    `/returns` smoke를 다시 실행해야 합니다.
- GitHub Actions affected deploy shaping:
  - `front#build`는 `opennextjs-cloudflare build`로 Worker 산출물 `.open-next/**`를
    만듭니다.
  - 실제 platform 배포는 Turbo task가 아니라 repo-local composite action으로
    분리했습니다.
  - `.github/actions/deploy-back/action.yml`은 AWS OIDC, ECR login, Docker
    `linux/arm64` image build/push, CodeDeploy deployment start를 묶습니다.
  - `.github/actions/deploy-front/action.yml`은 Cloudflare Worker deploy를 묶습니다.
  - `.github/workflows/deploy.yml`은 기존 `pnpm build` script를 호출합니다. workflow가
    `prepare:api`를 직접 호출하지 않습니다.
  - build 뒤 `turbo query affected --packages back front` JSON output을
    `actions/github-script`로 파싱해 `back`/`front` deploy 여부를 결정합니다.
  - `opennextjs-cloudflare build`가 내부에서 기본 `pnpm build`를 다시 부르는 재귀를
    막기 위해 OpenNext config의 Next build command를 `next build`로 고정했습니다.
  - deploy target 계산은 workflow 안에서 한 번만 실행합니다.
  - 임시 worktree에서 workflow 순서와 같이 `pnpm build` 뒤 deploy target JSON을
    계산했습니다. no-change는 대상 없음, front-only 변경은 front만, back README 변경은
    back만, `returnsQuerySchema` 변경은 generated API client 변경까지 반영되어 back/front
    둘 다 대상으로 잡혔습니다.
- 전체 test suite는 실행하지 않았습니다.

## Sub-Agent Findings

- Gap review: draft는 Cloudflare Pages를 이미 결정한 것처럼 보여 구현자가 잘못 갈 수
  있었습니다. Workers/OpenNext 또는 front rewrite 중 하나를 명시해야 했고, 이 문서에서는
  Workers/OpenNext로 정리했습니다.
- Repo review: `front/src/app/(stock-return)/result/page.tsx`,
  `front/src/app/api/[...path]/route.ts`, `front/src/server/token.ts`,
  `front/src/queries/api.ts`가 migration 핵심 변경 파일입니다.
- Proxy decision: 별도 proxy Worker를 만들지 않고 현재 Next.js `/api` route handler를
  유지합니다. 이 route handler가 Cloudflare Access service token header를 붙입니다.
- Security correction: back 코드에 custom header guard를 넣지 않고,
  `BACK_API_ORIGIN` 앞의 Cloudflare Access Service Auth가 먼저 막는 구조로
  정정했습니다.
- External review: `t4g.micro` 서울 compute는 약 `USD 7.59/month`, public IPv4는 약
  `USD 3.65/month`, gp3 10 GiB는 약 `USD 0.91/month`입니다. NAT Gateway는 월 약
  `USD 43`라 제외 결정이 비용상 타당합니다.

## Next

- GitHub Actions run에서 composite action 기반 affected deploy가 실제로 통과하는지
  확인합니다.
- ARM runtime smoke test를 자동화합니다.
