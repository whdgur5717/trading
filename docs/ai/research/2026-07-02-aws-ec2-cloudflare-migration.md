# AWS EC2 + Cloudflare Migration Decision Packet

Status: Reviewed after sub-agent feedback; front OpenNext spike passed
Last updated: 2026-07-02

## Verdict

- `back` 배포 플랫폼은 결정했습니다: AWS EC2 `t4g.micro` + Docker + ECR +
  CodeDeploy + Cloudflare Tunnel입니다.
- `front`는 "정적 Cloudflare Pages"로 단정하면 안 됩니다. 현재 repo는 Next.js
  server route와 server-rendered page가 있으므로, 현재 코드 유지 기준 1차 목표는
  Cloudflare Workers/OpenNext입니다.
- 구현 전에 반드시 풀어야 하는 핵심은 세 가지였고, 1번은 로컬 spike로 통과했습니다.
  1. `front`를 Cloudflare Workers/OpenNext로 빌드하고 `/api` proxy가 동작하는지
     확인합니다. 2026-07-02 로컬 spike에서 통과했습니다.
  2. Cloud Run IAM/Google ID token을 대체할 Cloudflare Access Service Auth를
     구성합니다.
  3. CodeDeploy가 실제로 실행할 `appspec.yml`과 hook script를 repo에 둡니다.

## Context

- GCP 무료 사용 구간 종료로 현재 Cloud Run 기반 배포를 AWS/Cloudflare 조합으로
  이전합니다.
- 사용량이 크다고 가정하지 않습니다.
- Vercel 같은 단순 클릭형 배포는 피하고, 포트폴리오에서 설명 가능한 자동화,
  보안, 롤백 구조를 만듭니다.
- 가격은 중요하지만, 보안 판단이 가격보다 우선입니다.
- 설명과 문서는 AWS를 잘 모르는 사람이 읽어도 흐름을 따라갈 수 있어야 합니다.

## Decided Architecture

```text
사용자
→ Cloudflare DNS/HTTPS
→ Cloudflare Workers/OpenNext front: ittaesalgeol.com
→ same-origin /api proxy
→ BACK_API_ORIGIN
→ Cloudflare Access Service Auth
→ Cloudflare Tunnel
→ EC2 t4g.micro
→ Docker container: trading-back
```

### Region

- AWS region은 전부 `ap-northeast-2` 서울로 통일합니다.
- ECR, EC2, CodeDeploy, Parameter Store, S3 deploy artifact bucket은 같은 리전에
  둡니다.

### Frontend

- `front`는 Cloudflare에 배포합니다.
- 현재 repo 기준 target은 Cloudflare Workers/OpenNext입니다.
- 정적 Cloudflare Pages만으로 배포하는 선택지는 현재 보류합니다.
  - `front/src/app/(stock-return)/result/page.tsx`는 server render 중 API를
    호출합니다.
- `front/src/app/api/[...path]/route.ts`는 Next route handler로 `/api` proxy를
  수행합니다.
- `/api` proxy는 별도 Cloudflare Worker로 분리하지 않고, 우선 현재 Next.js route
  handler를 유지합니다. 이 route handler는 OpenNext를 통해 Cloudflare Worker
  runtime에서 실행됩니다.
- 사용자가 보는 기본 도메인은 `ittaesalgeol.com`입니다.
- browser-facing API contract는 계속 same-origin `/api/*`로 유지합니다.
- `BACK_API_ORIGIN`은 front가 back에 붙기 위한 API origin입니다. 브라우저가
  직접 쓰는 공개 계약으로 보지 않습니다.

### Backend Compute

- `back`은 AWS EC2 `t4g.micro`에서 실행합니다.
- `t4g.micro`는 ARM/Graviton2, 2 vCPU, 1 GiB RAM, burstable instance입니다.
- `back`은 Docker 컨테이너로 실행합니다.
- EC2에서 `docker build`, `pnpm install`, `pnpm build`를 실행하지 않습니다.
- EC2는 이미 만들어진 이미지를 pull하고 실행만 합니다.
- AMI는 Amazon Linux 2023 ARM64를 1차 기준으로 둡니다.

### Image Registry

- Docker image registry는 AWS ECR private repository를 사용합니다.
- ECR repository도 `ap-northeast-2`에 둡니다.
- ECR lifecycle policy로 오래된 이미지를 제한하되, 직전 rollback 대상 tag는
  삭제되지 않게 둡니다.

### Deployment

- GitHub Actions가 CI와 image build를 담당합니다.
- GitHub Actions는 AWS OIDC로 AWS 권한을 임시 획득합니다.
- 장기 AWS access key는 GitHub Secrets에 저장하지 않습니다.
- GitHub Actions는 `linux/arm64` 이미지를 빌드해 ECR에 push합니다.
- GitHub Actions는 CodeDeploy revision artifact를 S3에 올리고 CodeDeploy
  deployment를 생성합니다.
- CodeDeploy application name은 `trading-back`, deployment group은
  `trading-back-prod`로 둡니다.
- CodeDeploy agent가 EC2에서 배포 hook을 실행합니다.
- repo에는 root `appspec.yml`과 `deploy/codedeploy/*` hook script를 둡니다.
- hook은 다음을 수행해야 합니다.
  - ECR login token 갱신
  - image tag 또는 image URI 읽기
  - Parameter Store에서 env file 생성
  - `cloudflared` tunnel token 확인
  - 새 image pull
  - back container 교체
  - 실패 시 이전 성공 revision으로 rollback
- 단일 EC2이므로 "자동 rollback"은 목표지만, 무중단 배포를 보장한다고 쓰지
  않습니다. 무중단 보장이 필요하면 ALB와 2대 이상의 compute가 필요하고 비용
  구조가 달라집니다.

### Network Exposure

- `BACK_API_ORIGIN`은 Cloudflare Tunnel을 통해 EC2 안의 back 컨테이너로
  연결합니다.
- `cloudflared`도 Docker 컨테이너로 실행합니다.
- 운영 기본값에서 EC2 inbound는 열지 않습니다.
  - `80`: 닫음
  - `443`: 닫음
  - app port: 닫음
  - `22` SSH: 닫음
- break-glass 운영 접속은 SSH가 아니라 AWS SSM Session Manager를 사용합니다.
  EC2 instance role에 SSM 권한을 붙이고, inbound는 계속 닫아둡니다.
- EC2에는 outbound 인터넷 연결이 필요합니다.
- 현재 비용/복잡도 기준에서는 NAT Gateway를 쓰지 않습니다.
- NAT Gateway 없이 IPv4 outbound를 안정적으로 쓰려면 EC2 public IPv4가 필요합니다.
  이 public IPv4는 과금되지만, 접근 허용 여부는 security group inbound 규칙이
  결정합니다.

### Backend Access Control

- Cloudflare Tunnel은 EC2 직접 노출을 줄이지만, API 인증을 대신하지 않습니다.
- back application code에는 custom header guard를 넣지 않습니다.
- Cloud Run IAM/Google ID token 대체 경계는 Cloudflare Access Service Auth로 둡니다.
- `BACK_API_ORIGIN`을 Cloudflare Access protected application으로 등록합니다.
- Access policy action은 `Service Auth`로 두고, OpenNext front의 Next.js proxy용
  service token만 허용합니다.
- Next.js `/api` proxy는 back API로 proxy할 때 다음 Cloudflare Access header를
  붙입니다.
  - `CF-Access-Client-Id`
  - `CF-Access-Client-Secret`
- browser에는 service token 값을 절대 내려주지 않습니다.
- Cloudflare Access가 요청을 먼저 검사합니다. token이 없거나 틀리면 Tunnel, EC2,
  back까지 도달하지 않아야 합니다.
- direct `BACK_API_ORIGIN` 호출은 Cloudflare Access에서 실패해야 합니다.
- Cloudflare WAF, rate limit, allowed methods 제한은 추가 방어선으로 둡니다.

### Secrets

- production back secret 원본은 AWS Parameter Store입니다.
- GitHub Actions는 runtime secret 값을 직접 만지지 않습니다.
- back env는 개별 `SecureString` parameter로 저장합니다.

```text
/trading/prod/back/APP_KEY
/trading/prod/back/APP_SECRET
/trading/prod/back/HOST
/trading/prod/back/PORT
/trading/prod/back/KIS_REST_BASE_URL
/trading/prod/back/KIS_WS_URL
/trading/prod/back/KIS_REALTIME_TR_ID
/trading/prod/back/PUBLIC_DATA_SERVICE_KEY
/trading/prod/back/DART_API_KEY
```

- Cloudflare Tunnel token도 Parameter Store에 둡니다.

```text
/trading/prod/tunnel/TOKEN
```

- 배포 hook은 tunnel token을 `/opt/trading/tunnel/.env`에도 `TOKEN=...` 형태로
  생성합니다. `cloudflared` container는 이 env file을 읽어 tunnel을 실행합니다.

- Cloudflare front runtime에는 별도 Cloudflare env/secret을 둡니다.

```text
APP_ORIGIN=https://ittaesalgeol.com
API_BASE_URL=BACK_API_ORIGIN
CF_ACCESS_CLIENT_ID=<Cloudflare Access service token client id>
CF_ACCESS_CLIENT_SECRET=<Cloudflare Access service token client secret>
```

- `CF_ACCESS_CLIENT_ID`와 `CF_ACCESS_CLIENT_SECRET`은 Cloudflare Worker secret으로
  저장합니다. GitHub Secrets와 back env에는 저장하지 않습니다.

- 배포 hook은 `/trading/prod/back` 아래 parameter를 path 기준으로 한 번에 읽어
  `.env` 파일을 생성합니다.
- hook에는 secret value나 key별 복사 로직을 박지 않습니다. parameter의 leaf name을
  env key로 사용합니다.
- 예상 command shape는 다음입니다.

```bash
aws ssm get-parameters-by-path \
  --path /trading/prod/back \
  --with-decryption \
  --recursive
```

- 생성되는 env file은 `/opt/trading/back/.env`로 두고 permission은 `0600`으로
  둡니다.
- Docker는 생성된 env file을 `--env-file` 또는 compose `env_file`로 읽습니다.
- 앱은 env validation으로 누락된 값을 검출합니다.

### Health Checks

- CodeDeploy hook에는 local health check를 넣지 않습니다.
- `BACK_API_ORIGIN` 직접 health endpoint를 공개 검증용으로 쓰지 않습니다.
  Cloudflare Access service token이 없으면 실패해야 합니다.

### Cost Baseline

- 가격은 2026-07-02 기준 확인값이며, 실제 청구는 AWS/Cloudflare 현재 가격과 사용량을
  따릅니다.
- `t4g.micro`: 서울 Linux On-Demand `USD 0.0104/hour`.
- 월 730시간 기준 EC2 compute는 약 `USD 7.59`.
- public IPv4: `USD 0.005/hour`, 월 730시간 기준 약 `USD 3.65`.
- gp3 EBS 10 GiB: 서울 기준 약 `USD 0.91/month`.
- ECR private storage: 서울 기준 `USD 0.10/GB-month`.
- CloudWatch logs와 S3 deploy artifact 저장 비용은 log retention과 artifact retention을
  짧게 잡으면 보통 cents 단위로 예상합니다.
- 현재 최소 예상 총액은 대략 월 `USD 12-13`입니다.
- Cloudflare Workers 유료 플랜이 필요해지면 대략 월 `USD 5`가 추가되어
  `USD 17-18` 수준으로 봐야 합니다. 무료 한도 안에서 유지되면 이 추가 비용은
  없습니다.
- NAT Gateway는 제외합니다. 서울 NAT Gateway 1개는 시간 비용만으로도 월 약
  `USD 43` 수준이라 현재 목표와 맞지 않습니다.

## Current Repo Facts

- 현재 deploy workflow는 GCP Cloud Run용입니다.
  - GitHub Actions에서 Docker image를 build/push합니다.
  - Google auth, Artifact Registry login, Cloud Run deploy를 수행합니다.
  - 현재 image build platform은 `linux/amd64`입니다.
- 현재 `back/Dockerfile`은 Node 24 slim 기반 multi-stage build입니다.
- 현재 루트 `pnpm build`는 OpenAPI 생성과 front generated client 생성을 먼저
  수행한 뒤 Turbo build를 실행합니다.
- Turbo는 build/type-check 영향 그래프를 담당합니다. 실제 Cloudflare/ECR/CodeDeploy
  배포 실행 여부는 workflow가 별도로 결정해야 합니다.
- 2026-07-02 로컬 측정에서 `back` production 프로세스 RSS는 시작 직후 약 41 MiB,
  `/stocks/suggestion` 200회 요청 후 약 130 MiB였습니다. EC2 전체 메모리는 OS,
  Docker, cloudflared, 로그, 배포 중 여유까지 포함해 봐야 합니다.
- 2026-07-02 `front` OpenNext spike 결과:
  - `@opennextjs/cloudflare`와 `wrangler`를 `front` devDependency로 추가했습니다.
  - `front/open-next.config.ts`와 `front/wrangler.jsonc`를 추가했습니다.
  - `front/src/server/token.ts`의 Google ID token 발급 로직을 제거했습니다.
  - `front/src/server/cloudflare-access.ts`에서 Worker env의
    `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`를 zod로 읽고 proxy header를
    붙입니다.
  - `front/src/app/api/[...path]/route.ts`는 incoming `CF-Access-*` header를 먼저
    삭제한 뒤 Worker env 값으로 덮어씁니다.
  - OpenNext preview와 local mock backend로 `/api/health` proxy, Access header
    주입, client spoof header 덮어쓰기를 확인했습니다.
- 2026-07-02 `back` CodeDeploy wiring 결과:
  - `appspec.yml`을 추가했습니다.
  - `deploy/codedeploy/deploy.mjs`를 추가했습니다. EC2의 CodeDeploy Agent가 실행합니다.
  - `scripts/deploy/create-codedeploy-deployment.mjs`를 추가했습니다. GitHub Actions에서
    S3 revision upload와 `CreateDeploymentCommand` 실행을 담당합니다.
  - `.github/workflows/deploy.yml`을 AWS OIDC, ECR arm64 image push, CodeDeploy
    deployment 생성 흐름으로 교체했습니다.
  - 실제 AWS 리소스 생성이나 배포 실행은 하지 않았습니다.

## Sub-Agent Review Synthesis

### Critical Findings

- 정적 Cloudflare Pages는 현재 repo와 맞지 않습니다. `front`에는 server-rendered
  page와 Next route handler가 있으므로 Workers/OpenNext 또는 front rewrite가
  필요합니다.
- 기존 `front/src/server/token.ts`는 Google ID token을 만들기 때문에 AWS/Cloudflare
  구조에서는 제거 또는 교체가 필요합니다.
- API public contract를 결정해야 했고, 이 문서에서 same-origin `/api/*` 유지로
  결정했습니다.
- Cloudflare Tunnel만으로 API abuse 방어가 되는 것은 아닙니다. Cloudflare Access
  Service Auth와 Cloudflare edge rule을 추가해야 합니다.
- CodeDeploy는 "컨테이너를 알아서 배포하는 서비스"가 아닙니다. EC2 안에서
  `appspec.yml` lifecycle hook script가 pull/start를 직접 수행해야 합니다.
- SSH를 닫으면 복구 경로가 필요합니다. 이 문서에서 SSM Session Manager를 기본
  복구 경로로 결정했습니다.

### Repo Files That Must Change

- `.github/workflows/deploy.yml`: GCP Cloud Run workflow를 AWS OIDC, ECR push,
  S3 revision upload, CodeDeploy trigger, Cloudflare front deploy 흐름으로 교체
  또는 분리합니다.
- `front/package.json`, `front/next.config.ts`: Cloudflare Workers/OpenNext build와
  deploy script를 추가합니다.
- `front/src/app/api/[...path]/route.ts`: 별도 proxy Worker로 빼지 않고 유지합니다.
  Google ID token 대신 Cloudflare Access service token header를 붙이는 proxy로
  바꿉니다.
- `front/src/server/token.ts`: Cloud Run IAM용 Google token 발급 로직을 제거하거나
  새 Cloudflare/AWS 구조에 맞게 교체합니다.
- `front/src/queries/api.ts`: same-origin `/api` 계약을 유지하되 Cloudflare runtime
  env에서 `APP_ORIGIN`이 맞게 주입되는지 검증합니다.
- `appspec.yml`: CodeDeploy EC2 deployment lifecycle 정의를 추가합니다.
- `deploy/codedeploy/*`: ECR login, env generation, container start script를
  추가합니다.
- `wrangler.toml` 또는 Cloudflare equivalent config: Workers/OpenNext deployment
  설정을 repo에 둡니다.

### External Caveats

- `t4g.micro`는 burstable instance입니다. CPU를 오래 많이 쓰면 surplus credit 비용이
  생길 수 있습니다.
- public IPv4는 in-use와 idle 모두 시간 과금됩니다.
- ECR pull을 하려면 EC2 hook에서 ECR login token을 갱신해야 합니다.
- Parameter Store `GetParametersByPath`는 path 권한이 넓으면 하위 secret까지 읽힐 수
  있으므로 IAM path를 좁게 잡아야 합니다.
- Cloudflare Tunnel token은 가진 사람이 tunnel을 띄울 수 있으므로 production secret
  으로 취급하고 rotation 절차를 둡니다.
- GitHub OIDC AWS role trust policy는 repository/branch 기준으로 좁게 제한합니다.

## Implementation Checklist

1. Cloudflare Workers/OpenNext build spike를 수행합니다. 완료.
   - `pnpm --filter front type-check` 통과.
   - `pnpm --filter front build` 통과.
   - `pnpm --filter front exec opennextjs-cloudflare build` 통과.
   - OpenNext preview에서 `/api/*` route handler와 `CF_ACCESS_*` runtime env 주입을
     확인했습니다.
2. Cloudflare Access Service Auth를 구성합니다. repo-side runbook 추가.
   - `BACK_API_ORIGIN` protected application을 만듭니다.
   - policy action은 `Service Auth`로 둡니다.
   - OpenNext front의 Next.js proxy service token만 허용합니다.
   - Next.js `/api` proxy 요청만 Tunnel까지 통과해야 합니다.
   - direct `BACK_API_ORIGIN` 요청은 Cloudflare Access에서 실패해야 합니다.
   - External Cloudflare setup은 아직 실행하지 않았습니다.
3. AWS base resource를 구성합니다.
   - EC2 `t4g.micro` Amazon Linux 2023 ARM64.
   - EBS gp3 10 GiB 이상.
   - EC2 instance profile: ECR read, Parameter Store read, SSM Session Manager.
   - security group inbound empty.
   - `deploy/aws/README.md`와 `deploy/aws/iam/*.json`에 runbook과 IAM draft를
     추가했습니다. External AWS setup은 아직 실행하지 않았습니다.
   - 2026-07-02 read-only AWS CLI 조회 결과 서울 리전에 기존 VPC/subnet이 없으므로,
     새 VPC, public subnet, internet gateway, route table 생성이 base resource
     구성의 첫 단계입니다.
   - 2026-07-02 승인 후 AWS CLI로 `trading-prod` VPC networking을 생성했습니다.
     생성 범위는 VPC, Internet Gateway, public subnet, route table, inbound empty
     security group입니다. 이 단계에서는 IAM, ECR, S3, CodeDeploy, EC2를 만들지
     않았습니다.
   - 2026-07-02 승인 후 AWS CLI로 GitHub Actions OIDC deploy role, EC2 instance
     role/profile, CodeDeploy service role을 생성하고 read-only 검증했습니다. 이
     단계에서는 ECR, S3, CodeDeploy application/deployment group, EC2를 만들지
     않았습니다.
   - 2026-07-02 승인 후 AWS CLI로 ECR repository `trading-back`과 CodeDeploy artifact
     S3 bucket을 생성하고 read-only 검증했습니다. 이 단계에서는 CodeDeploy
     application/deployment group과 EC2를 만들지 않았습니다.
   - 2026-07-02 승인 후 AWS CLI로 CodeDeploy application `trading-back`과 deployment
     group `trading-back-prod`를 생성하고 read-only 검증했습니다.
   - 2026-07-02 승인 후 AWS CLI로 production back EC2 `i-0e5c27c2b9180198b`를 생성하고
     read-only 검증했습니다. EC2는 `running`, status checks `ok`, SSM `Online`입니다.
   - 2026-07-02 승인 후 SSM Run Command로 EC2 host bootstrap을 완료했습니다. Docker,
     Node.js 20, Ruby, wget, CodeDeploy agent, `/opt/trading/back` directory가 준비됐고,
     Docker와 CodeDeploy agent는 `active`/`enabled`입니다.
   - 2026-07-02 승인 후 EC2 host Node.js를 Node.js official Linux ARM64 tarball 기반
     `v24.18.0`으로 올리고 read-only 검증했습니다.
   - 2026-07-02 잘못 추가했던 SSM 일괄 등록 script는 제거했습니다. Back runtime
     env는 AWS SSM Parameter Store SecureString에서 직접 관리하고, GitHub Actions나
     repo script가 런타임 secret을 보관/검증하지 않습니다.
   - 2026-07-02 `gh` CLI로 AWS deploy workflow에 필요한 GitHub Actions repository
     variables를 설정했습니다.
4. CodeDeploy artifact를 repo에 추가합니다.
   - `appspec.yml`. 완료.
   - `deploy/codedeploy/deploy.mjs`. 완료.
   - S3 deploy artifact bucket.
   - deployment group target tag.
5. GitHub Actions workflow를 교체합니다.
   - AWS OIDC auth. 완료.
   - `linux/arm64` back image build. 완료.
   - ECR push. 완료.
   - CodeDeploy deployment create. 완료.
   - Cloudflare Workers/OpenNext deploy.
6. Smoke test를 자동화합니다.
   - arm64 image build smoke.
7. 운영 guardrail을 추가합니다.
   - ECR lifecycle policy.
   - log rotation 또는 CloudWatch log retention.
   - AWS budget alert.
   - Cloudflare WAF/rate-limit 최소 rule.
8. Cutover plan을 작성합니다.
   - 기존 Cloud Run과 새 AWS/Cloudflare 병행 확인.
   - DNS 전환.
   - 실패 시 Cloud Run으로 되돌리는 방법.
