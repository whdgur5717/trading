# Progress

Last updated: 2026-07-02

## Done

- 루트 `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, 패키지별 `AGENTS.md`가 프로젝트
  기본 지침으로 존재합니다.
- Codex 프로젝트 운영 체계를 `docs/ai/`에 저장소 기록으로 남기기로 했습니다.
- `.codex/config.toml`로 repo-local Codex Memories, hooks, multi-agent 기능을
  켰습니다.
- `docs/ai/` 기본 기록 구조를 만들었습니다.
- 루트 `AGENTS.md`에 AI 작업 기록 루프를 연결했습니다.
- `.agents/skills/project-operating-system` repo skill을 추가했습니다.
- 사람이 보는 진입점 `docs/ai/START_HERE.md`를 추가했습니다.
- 프로젝트 맥락, 디자인 맥락, 기능 노트, 문서 형식 저장 위치를 추가했습니다.
- `a.txt` 요청 기준 `back` KIS 호출부, MSW mock 경계, 공식 KIS 유량 제한,
  `913748b` 대비 Port/Adapter 결합도 변화를 분석했습니다.
- 2026-06-25 main 배포 장애를 분석하고
  `docs/ai/research/2026-06-26-deploy-failure-response.md`에 보고서와 해결
  방향을 남겼습니다.
- `packages/api-client`를 추가해 OpenAPI artifact, generator, front target
  templates를 백엔드 패키지에서 분리했습니다.
- 루트 `pnpm type-check`와 `pnpm build`가 Turbo 그래프를 타도록 연결했습니다.
- 신입 풀스택 이력서에 사용할 프로젝트 강조 포인트를 `back`, `front`,
  repo-wide/DevOps 영역으로 나눠 조사하고
  `docs/ai/tasks/TASK-0007-resume-evidence-mining.md`에 정리했습니다.
- GCP Cloud Run에서 AWS EC2 + Cloudflare로 옮기는 배포 방향을 정리했습니다.
  `back`은 EC2 `t4g.micro` + Docker + ECR + CodeDeploy + Cloudflare Tunnel로
  결정했고, `front`는 현재 Next.js server 기능 때문에 Cloudflare Workers/OpenNext를
  1차 target으로 정리했습니다.
- AWS/Cloudflare migration decision packet과 서브에이전트 리뷰 결과를
  `docs/ai/research/2026-07-02-aws-ec2-cloudflare-migration.md`,
  `docs/ai/decisions/2026-07-02-aws-ec2-cloudflare-deployment.md`,
  `docs/ai/tasks/TASK-0008-aws-ec2-cloudflare-migration.md`에 남겼습니다.
- `front` Cloudflare Workers/OpenNext spike를 통과시켰습니다. `/api` proxy는 유지하고,
  Google ID token 대신 Cloudflare Access service token header를 Worker env에서 읽어
  붙이도록 변경했습니다.
- back 배포용 CodeDeploy wiring을 추가했습니다. GitHub Actions는 AWS OIDC로 권한을
  받고 ECR에 `linux/arm64` back image를 push한 뒤, Node script가 AWS CLI로 CodeDeploy
  revision push와 deployment 생성을 수행합니다. EC2에서는 CodeDeploy Agent가
  `deploy/codedeploy/deploy.mjs`를 실행해 Parameter Store env file 생성과 Docker
  pull/run을 수행합니다.
- Cloudflare Access Service Auth runbook을 추가했습니다. `BACK_API_ORIGIN` protected
  application, `Service Auth` policy, `trading-front-prod` service token, Worker
  secret 저장 위치, direct origin 차단 검증 기준을 정리했습니다.
- AWS bootstrap runbook과 IAM draft를 추가했습니다. `deploy/aws/README.md`에 AWS
  resource 생성 순서와 EC2 host bootstrap 기준을 정리했고, `deploy/aws/iam/*.json`에
  GitHub Actions OIDC role, EC2 instance role, CodeDeploy service role 초안을
  추가했습니다.
- 서울 리전 `ap-northeast-2`의 VPC, subnet, route table, internet gateway를
  read-only AWS CLI로 조회했고 모두 0개임을 확인했습니다. `deploy/aws/README.md`는
  새 VPC, public subnet, internet gateway, route table 생성부터 시작하도록
  정정했습니다.
- 승인 후 AWS CLI로 `trading-prod` VPC networking을 생성했습니다. 범위는 VPC,
  Internet Gateway, public subnet, route table, inbound empty security group입니다.
  이 단계에서는 IAM, ECR, S3, CodeDeploy, EC2를 만들지 않았습니다.
- 승인 후 AWS CLI로 IAM deploy 기반을 생성했습니다. 범위는 GitHub Actions OIDC deploy
  role, EC2 instance role/profile, CodeDeploy service role입니다. 이 단계에서는 ECR,
  S3, CodeDeploy application/deployment group, EC2를 만들지 않았습니다.
- 승인 후 AWS CLI로 ECR repository `trading-back`과 CodeDeploy artifact S3 bucket을
  생성했습니다. 이 단계에서는 CodeDeploy application/deployment group과 EC2를 만들지
  않았습니다.
- 승인 후 AWS CLI로 CodeDeploy application `trading-back`과 deployment group
  `trading-back-prod`를 생성했습니다.
- 승인 후 AWS CLI로 production back EC2 `i-0e5c27c2b9180198b`를 생성했습니다. Instance
  type은 `t4g.micro`, OS는 Amazon Linux 2023 ARM64, instance profile은
  `trading-back-ec2`, security group inbound는 empty입니다.
- 승인 후 SSM Run Command로 EC2 host bootstrap을 완료했습니다. Docker, Node.js 20,
  Ruby, wget, CodeDeploy agent를 설치했고 `/opt/trading/back`을 root-only directory로
  준비했습니다. 앱 container와 Cloudflare Tunnel은 아직 설정하지 않았습니다.
- 승인 후 SSM Run Command로 EC2 host Node.js를 Node.js official Linux ARM64 tarball
  기반 `v24.18.0`으로 올렸습니다.
- 잘못 추가했던 SSM 일괄 등록 script를 제거했습니다. Back runtime env는
  repo script나 GitHub Actions가 보관/검증하지 않고 AWS SSM Parameter Store
  SecureString에서 직접 관리합니다.
- `gh` CLI로 AWS deploy workflow에 필요한 GitHub Actions repository variables를
  설정했습니다.

## In Progress

- `TASK-0002`: Backend error layer.
- `TASK-0003`: API request verification.
- `TASK-0008`: AWS EC2 + Cloudflare migration implementation planning.

## Blocked

- 없음.

## Verification

- `quick_validate.py`를 임시 venv에서 실행했고 `Skill is valid!` 결과를
  확인했습니다.
- `.codex/config.toml`은 Python `tomllib`로 파싱 확인했습니다.
- 변경 파일 범위는 `AGENTS.md`, `.codex/`, `docs/ai/`,
  `.agents/skills/project-operating-system/`입니다.
- skill 이름을 `project-operating-system`으로 바꾼 뒤 validator를 다시 통과했습니다.
- 이전 `trading-project-workflow` 참조가 남지 않았음을 `rg`로 확인했습니다.
- `rg`, `git grep`, `node` 스크립트, KIS 공식 포털 조회로 KIS 분석 결과를
  검증했습니다. 분석 작업이라 test suite는 실행하지 않았습니다.
- 배포 장애 보고서는 `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`,
  `back/Dockerfile`, `front/Dockerfile`, `back/src/config/env.validation.ts`,
  `back/src/main.ts`, GitHub Actions run 상태, Cloud Run service image 상태를
  확인해 작성했습니다. 문서 작업이라 test suite는 실행하지 않았습니다.
- `pnpm type-check` 통과.
- `pnpm build` 통과. 최종 재실행에서 6개 Turbo task 모두 cache hit.
- OpenAPI contract metadata 임시 변경 smoke에서 `//:generate:openapi`와
  `front:generate:api`가 재실행됨을 확인했습니다.
- OpenAPI response shape 임시 변경 smoke에서 generated schema 변경이
  `front:type-check`와 `front:build`를 invalidate함을 확인했습니다.
- `@trading/api-client`에서 `es-toolkit` 의존성을 제거했고, generated output diff
  없이 `pnpm build`를 통과했습니다.
- CI와 deploy workflow가 Turbo 기반 OpenAPI/front client 생성 경로를 타도록
  갱신했습니다. `front/Dockerfile`도 container build 안에서 `generate:api`를 먼저
  실행하도록 바꿨습니다.
- `pnpm --filter back exec vitest run test/e2e/openapi.spec.js`는
  `/jobju/score`가 현재 502를 반환해 실패합니다. `JobjuService.score()`가 아직
  성공 점수 계산을 구현하지 않고 `jobju-score-unavailable`을 반환하는 상태입니다.
- 이력서 근거 조사는 서브에이전트 3개와 로컬 `rg`/`find`/`nl -ba` 확인으로
  수행했습니다. 분석 작업이라 test suite는 실행하지 않았습니다.
- AWS/Cloudflare migration 방향은 서브에이전트 3개로 gap review, repo compatibility
  review, external pricing/security review를 수행했습니다. 핵심 결론은 정적
  Cloudflare Pages가 현재 repo와 맞지 않고 Workers/OpenNext target이 필요하다는
  점입니다.
- back 접근 보호는 app code header guard가 아니라 Cloudflare Access Service Auth로
  정정했습니다. `BACK_API_ORIGIN`은 OpenNext front의 Next.js proxy service
  token만 통과해야 합니다.
- `/api` proxy는 별도 Cloudflare Worker로 분리하지 않고 현재 Next.js route handler를
  유지하기로 정리했습니다.
- `pnpm --filter back build` 통과. `back` production 서버를 로컬에서 임시 실행해
  시작 직후 RSS 약 41 MiB, `/stocks/suggestion` 200회 후 약 130 MiB를 확인했습니다.
  문서/설계 작업이라 전체 test suite는 실행하지 않았습니다.
- `pnpm --filter front type-check` 통과.
- `pnpm --filter front build` 통과.
- `pnpm --filter front exec opennextjs-cloudflare build` 통과. build 중 generated bundle의
  duplicate `options` key 경고가 1개 나오지만 worker bundle은 생성됩니다.
- OpenNext preview + local mock backend에서 `/api/health` proxy가 동작했고,
  `CF_ACCESS_CLIENT_ID=local-client`, `CF_ACCESS_CLIENT_SECRET=local-secret`가 back에
  전달됨을 확인했습니다.
- client가 가짜 `CF-Access-*` header를 보내도 proxy가 Worker env 값으로 덮어쓰는 것을
  확인했습니다.
- Cloudflare Access Service Auth 자체는 문서/코드 계약만 확정했습니다. 실제
  Cloudflare protected application, Service Auth policy, service token 생성과 direct
  `BACK_API_ORIGIN` 차단 검증은 아직 실행하지 않았습니다.
- AWS bootstrap 초안은 `node` JSON parse와 `git diff --check -- deploy/aws`를
  통과했습니다. 실제 AWS IAM/ECR/S3/CodeDeploy/EC2 생성 명령은 실행하지 않았습니다.
- AWS networking 생성 후 read-only 검증에서 VPC state `available`, subnet
  `MapPublicIpOnLaunch=true`, route `0.0.0.0/0 -> Internet Gateway active`, security
  group inbound empty를 확인했습니다.
- AWS IAM 생성 후 read-only 검증에서 GitHub Actions role trust가 target repo `main`
  branch로 제한된 것, EC2 role/profile 연결, `AmazonSSMManagedInstanceCore`,
  `AWSCodeDeployRole`, inline policy names를 확인했습니다.
- AWS ECR/S3 생성 후 read-only 검증에서 ECR immutable tag, scan on push, AES256,
  lifecycle policy와 S3 public access block, versioning, AES256, lifecycle policy를
  확인했습니다.
- AWS CodeDeploy 생성 후 read-only 검증에서 application compute platform `Server`,
  deployment group tag filter, service role, deployment config, auto rollback 설정을
  확인했습니다. EC2 생성 후 matching running instance는 1개입니다.
- AWS EC2 생성 후 read-only 검증에서 instance state `running`, system/instance status
  `ok`, SSM managed instance `Online`, root volume gp3 10 GiB encrypted, security group
  inbound empty, CodeDeploy target tag matching instance 1개를 확인했습니다.
- AWS EC2 bootstrap 후 SSM 검증에서 AWS CLI `2.33.15`, Node.js `20.20.2`, Docker
  `25.0.14`, Docker service `active/enabled`, CodeDeploy agent service
  `active/enabled`, `/opt/trading/back` `root:root 700`, `iptables` 존재, running
  Docker container 0개를 확인했습니다.
- AWS EC2 Node.js 24 update 후 SSM 검증에서 `/usr/bin/node`가
  `/usr/local/lib/nodejs/node-v24.18.0-linux-arm64/bin/node`를 가리키고, `node --version`
  은 `v24.18.0`, npm/npx는 `11.16.0`, CodeDeploy agent는 `active`임을 확인했습니다.
- 잘못 추가했던 SSM 일괄 등록 script는 제거했습니다. 남은 배포 경로는 EC2 CodeDeploy hook이
  AWS SSM Parameter Store에서 SecureString을 읽어 container env로 주입하는 구조입니다.
- `gh variable list`로 AWS deploy repository variables가 설정된 것을 확인했습니다.
- `node --check scripts/deploy/create-codedeploy-deployment.mjs` 통과.
- `node --check deploy/codedeploy/deploy.mjs` 통과.
- `pnpm build` 통과.
- `pnpm --filter front exec opennextjs-cloudflare build` 통과. 같은 duplicate `options`
  warning은 남지만 build는 성공합니다.
- CodeDeploy revision push/deployment script는 AWS SDK나 zip library 없이 AWS CLI를
  호출하는 방식으로 정리했고, Node 문법 검사를 통과했습니다.
- 첫 main Deploy run은 ECR image push 중 manifest HEAD 확인에서 `403 Forbidden`으로
  실패했습니다. `trading-github-actions-deploy`에 `ecr:BatchGetImage`,
  `ecr:GetDownloadUrlForLayer`, `ecr:DescribeImages`를 추가했고 IAM simulator에서
  해당 action들이 `allowed`임을 확인했습니다.
- 두 번째 main Deploy run은 ECR image push를 통과했지만 `aws deploy push`가
  CodeDeploy `RegisterApplicationRevision` 권한 누락으로 실패했습니다. GitHub
  Actions deploy role에 `codedeploy:RegisterApplicationRevision`을 추가하고,
  `codedeploy:GetDeployment` resource를 deployment group ARN으로 정정했습니다.
- 세 번째 main Deploy run은 ECR image push와 CodeDeploy revision 등록을 통과했지만
  `create-deployment` 중 `codedeploy:GetDeploymentConfig` 권한 누락으로 실패했습니다.
  GitHub Actions deploy role에 `CodeDeployDefault.OneAtATime` deployment config 조회
  권한을 추가했고 IAM simulator에서 `allowed`를 확인했습니다.
- 네 번째 main Deploy run은 CodeDeploy deployment 생성까지 통과했지만 EC2
  `ApplicationStart` hook에서 `ssm:GetParametersByPath`가 base path
  `/trading/prod/back` ARN 권한 누락으로 실패했습니다. EC2 role policy에 base path와
  하위 path ARN을 모두 허용했고, SSM Run Command로 값 출력 없이 parameter count
  조회 성공을 확인했습니다.
- 다섯 번째 main Deploy run은 같은 SSM 권한 오류로 실패했습니다. 실제 EC2 role policy와
  SSM Run Command 조회는 성공했기 때문에 CodeDeploy agent를 재시작했고, 실패한
  deployment archive의 `deploy.mjs`를 EC2에서 직접 실행해 SSM read, ECR pull, Docker
  run이 성공함을 확인했습니다.
- 이후 host loopback `/health`가 empty reply를 반환하는 문제는 Parameter Store의
  `HOST=127.0.0.1` 때문이었습니다. `/trading/prod/back/HOST`를 `0.0.0.0`으로 갱신했고,
  같은 deploy hook 재실행 후 host `127.0.0.1:4000/health`가 200을 반환했습니다.
- `git diff --check` 통과.
