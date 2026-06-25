# Decision: AI Operating Records

Date: 2026-06-18
Status: Accepted

## Context

이 프로젝트는 AI가 단순 구현 도구가 아니라 PM, 디자이너, 개발자처럼 협업하며
진행 상태와 결정 이유를 이어받을 수 있어야 합니다. Codex Memories는 개인 로컬
상태에 저장되므로 팀/프로젝트의 공식 기록으로 쓰기 어렵습니다.

## Decision

- Codex Memories는 repo-local 설정으로 켜서 보조 기억으로 사용합니다.
- 프로젝트 공식 작업 기록은 `docs/ai/`에 저장합니다.
- 자동 기록 루프는 루트 `AGENTS.md`와 repo skill
  `project-operating-system`으로 강제합니다.
- 사람이 보는 진입점은 `docs/ai/START_HERE.md`로 둡니다.
- 기능 맥락은 `docs/ai/features/`, 디자인 적용 맥락은 `docs/ai/design/`에
  저장합니다.
- Hook 기반 검사는 초기 운영 후 기록 누락이 반복될 때 추가합니다.

## Consequences

- 사용자는 매번 기록 파일을 지정하지 않아도 됩니다.
- 에이전트는 작업 시작 시 현재 맥락을 읽고, 작업 종료 전 관련 기록을 갱신해야
  합니다.
- 기록 파일이 너무 커지면 완료된 상세 내용은 작업 파일이나 결정 파일로 옮깁니다.

## Verification

- `docs/ai/active-context.md`, `docs/ai/progress.md`,
  `docs/ai/tasks/_index.md`가 존재해야 합니다.
- `.agents/skills/project-operating-system/SKILL.md`가 skill validator를 통과해야
  합니다.
