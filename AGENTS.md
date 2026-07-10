# 저장소 작업 가이드

## 프로젝트 구조

이 저장소는 pnpm workspace 기반 모노레포이며, 패키지는 서로 독립적으로 다룹니다.
`front`, `back`, `packages/api-client`는 각각 자기 작업 규칙을 가진 패키지로
취급합니다.

## 관련 문서

- `PRODUCT.md`는 사용자, 제품 목적, 브랜드 톤, 지양할 방향, 제품/접근성 원칙을
  담고 있습니다. 제품 기획, 기능 의도, 문구, 공유 맥락과 관련된 작업을 할 때
  먼저 읽습니다.
- `DESIGN.md`는 색상, 타이포그래피, 표면, 컴포넌트, 레이아웃 규칙을 담은
  디자인 시스템 문서입니다. UI, 스타일, 컴포넌트, 레이아웃과 관련된 작업을 할
  때 먼저 읽습니다.
- `Glossary.md`는 프로젝트 용어 사전입니다. 구현 세부사항이나 작업 계획을 넣지
  않습니다.
- `docs/adr/`는 기술/구조 결정의 이유를 남기는 곳입니다.
- `packages/api-client/AGENTS.md`는 OpenAPI 기반 프론트 생성 클라이언트 작업
  규칙을 담고 있습니다.

## 에이전트 작업 규칙

- `front`, `back`, `packages/api-client`는 독립 패키지로 취급합니다.
- 한 패키지 안의 문제를 해결하려고 다른 패키지를 임의로 탐색하거나 수정하지
  않습니다.
- 작업상 필요하면 먼저 교차 패키지 변경이 필요한 이유를 제안합니다.

- `pnpm.lock.yaml` 파일을 임의로 내용을 수정하지 말것(수동 패치 금지), 변경이 필요하다면 `pnpm install`을 진행

## 에이전트 스킬

### 이슈 트래커

이슈와 PRD는 GitHub Issues에 둔다. 외부 PR은 트리아지 입력으로 쓰지 않는다.
자세한 기준은 `docs/agents/issue-tracker.md`를 본다.

### 트리아지 라벨

mattpocock/skills의 기본 트리아지 라벨을 사용한다. 실제 라벨 값은
`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`다.
자세한 기준은 `docs/agents/triage-labels.md`를 본다.

### 도메인 문서

도메인 문서는 단일 맥락 기준으로 관리한다. 루트 `Glossary.md`는 도메인 용어,
`docs/adr/`는 구조적 결정을 담는다. 자세한 기준은 `docs/agents/domain.md`를
본다.
