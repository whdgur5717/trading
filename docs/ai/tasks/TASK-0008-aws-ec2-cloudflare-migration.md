# TASK-0008: AWS EC2 + Cloudflare migration

Status: In progress; front OpenNext and back CodeDeploy wiring added
Last updated: 2026-07-02

## Goal

GCP Cloud Run 배포를 AWS EC2 + Cloudflare 기반 배포로 이전하기 위한 확정 결정,
남은 검증 항목, 구현 순서를 기록합니다.

## Scope

- In: AWS EC2, ECR, CodeDeploy, Cloudflare Workers/OpenNext, Cloudflare Tunnel,
  Parameter Store, GitHub Actions OIDC, Docker image 배포, rollback 설계.
- Out: 실제 AWS/Cloudflare 리소스 생성, secret 값 기록.

## Decisions Recorded

- `front`: Cloudflare Workers/OpenNext 배포. 정적 Cloudflare Pages 단독 배포는 현재
  Next.js server 기능 때문에 보류.
- `back`: EC2 `t4g.micro`, Docker 실행.
- Region: `ap-northeast-2`.
- Image registry: ECR.
- Deploy manager: CodeDeploy.
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

- Cloudflare Access protected application과 Service Auth policy를 Cloudflare 계정에
  실제 생성하고 검증합니다. repo에는 2026-07-02 runbook을 추가했지만 외부 설정은 아직
  실행하지 않았습니다.
- AWS bootstrap runbook을 기준으로 다음 단계를 진행합니다. VPC networking, IAM, ECR,
  S3, CodeDeploy, EC2, EC2 host bootstrap은 완료됐습니다. 다음 AWS 작업은 production
  첫 배포 준비입니다. production back Parameter Store 값 등록도 완료됐습니다.
- EC2 host bootstrap을 실행합니다: Node, Docker, AWS CLI 확인, CodeDeploy Agent,
  SSM Agent 확인.
- GitHub Actions에 Cloudflare Workers/OpenNext front deploy step을 추가합니다.
- ARM runtime smoke test를 자동화합니다.
