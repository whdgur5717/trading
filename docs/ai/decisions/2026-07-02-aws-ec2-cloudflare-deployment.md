# AWS EC2 + Cloudflare Deployment Direction

Date: 2026-07-02

## Context

GCP 무료 구간 종료로 `trading` 배포 플랫폼을 바꿔야 합니다. 조건은 보안 우선,
월 저비용, 포트폴리오에 남길 만한 자동화, 임시 수동 배포 금지입니다.

## Decision

- AWS region은 `ap-northeast-2` 서울로 통일합니다.
- `front`는 Cloudflare에 배포하고 `ittaesalgeol.com`으로 제공합니다.
- 현재 repo 기준 `front` target은 정적 Cloudflare Pages가 아니라 Cloudflare
  Workers/OpenNext입니다. 현재 Next.js server route와 server-rendered page를 유지하기
  위한 선택입니다.
- browser-facing API contract는 same-origin `/api/*`로 유지합니다.
- `/api` proxy는 별도 Cloudflare Worker로 분리하지 않고 현재 Next.js route handler를
  유지합니다. 이 route handler는 OpenNext를 통해 Cloudflare Worker runtime에서
  실행됩니다.
- `back`은 AWS EC2 `t4g.micro`에서 Docker 컨테이너로 실행합니다.
- Docker image는 ECR private repository에 저장합니다.
- GitHub Actions는 AWS OIDC로 권한을 임시 획득하고, `linux/arm64` 이미지를
  build/push합니다.
- EC2 배포 관리는 CodeDeploy로 합니다.
- CodeDeploy revision artifact는 S3에 올리고, EC2는 repo의 `appspec.yml`과
  `deploy/codedeploy/*` hook으로 pull/start를 수행합니다.
- `BACK_API_ORIGIN`은 Cloudflare Tunnel로 EC2 내부 `trading-back` 컨테이너에
  연결합니다.
- `cloudflared`도 Docker 컨테이너로 실행합니다.
- EC2 inbound는 운영 기본값에서 열지 않습니다. SSH도 운영 기본 미개방입니다.
- 운영 접속과 복구는 AWS SSM Session Manager를 기본 경로로 둡니다.
- production secret은 AWS Parameter Store에 개별 key로 저장하고, 배포 hook은
  `/trading/prod/back` path 아래 값을 일괄 조회해 env file을 생성합니다.
- Cloudflare Tunnel token은 `/trading/prod/tunnel/TOKEN`에 저장합니다.
- Cloud Run IAM/Google ID token 대체 경계는 Cloudflare Access Service Auth로 둡니다.
- `BACK_API_ORIGIN`은 Cloudflare Access protected application으로 등록하고,
  `Service Auth` policy에서 OpenNext front의 Next.js proxy용 service token만
  허용합니다.
- Next.js `/api` proxy는 back API로 proxy할 때 `CF-Access-Client-Id`와
  `CF-Access-Client-Secret`을 붙입니다. back application code에는 custom header guard를
  넣지 않습니다.
- Cloudflare Access service token 값은 Cloudflare Worker secret에만 저장하고 GitHub
  Secrets와 back env에는 저장하지 않습니다.

## Consequences

- EC2 public endpoint를 직접 열지 않고 Cloudflare를 공개 입구로 둡니다.
- NAT Gateway, ALB는 현재 비용/복잡도 기준에서 제외합니다.
- public IPv4 비용, EBS, ECR 저장, CloudWatch 로그 비용은 남습니다.
- 현재 최소 예상 비용은 약 `USD 12-13/month`입니다. Cloudflare Workers paid plan이
  필요해지면 약 `USD 5/month`가 추가될 수 있습니다.
- 현재 Cloud Run IAM/Google ID token 기반 호출 방식은 Cloudflare Access Service
  Token 기반 호출로 교체해야 합니다.
- Cloudflare Tunnel은 서버 직접 노출을 줄이지만, 공개 API abuse 방어를 대신하지
  않습니다.
- 단일 EC2이므로 자동 rollback은 만들 수 있지만, 무중단 배포를 보장한다고 쓰지는
  않습니다.

## Verification

- Cloudflare Workers/OpenNext가 현재 `front` Next.js 기능을 수용할 수 있는지:
  2026-07-02 local spike에서 `front` type-check, Next build, OpenNext build가
  통과했습니다.
- OpenNext preview + local mock backend에서 `/api/health` proxy와
  `CF-Access-Client-Id`, `CF-Access-Client-Secret` 주입을 확인했습니다.
- client가 가짜 `CF-Access-*` header를 보내도 Next.js proxy가 제거 후 Worker env
  값으로 덮어쓰는 것을 확인했습니다.
- CodeDeploy wiring은 repo 수준에서 추가했습니다:
  - `appspec.yml`.
  - `deploy/codedeploy/deploy.mjs`.
  - `scripts/deploy/create-codedeploy-deployment.mjs`.
  - `.github/workflows/deploy.yml` AWS OIDC/ECR/CodeDeploy 흐름.
- local syntax/build verification은 통과했지만, 실제 AWS 배포 실행은 아직 하지
  않았습니다.

## Verification Needed

- Cloudflare Access Service Auth가 direct `BACK_API_ORIGIN` 요청을 back 도달 전에
  차단하는지.
- `back` image가 `linux/arm64`에서 build/run 되는지.
- CodeDeploy hook rollback이 단일 EC2 + Docker 구성에서 실제로 동작하는지.
- Parameter Store by-path env 생성이 key-by-key mapping 없이 동작하는지.
- t4g.micro에서 Docker, cloudflared, back이 여유 있게 동작하는지.

상세 설계와 리뷰 요청은 `docs/ai/research/2026-07-02-aws-ec2-cloudflare-migration.md`를
기준으로 합니다.
