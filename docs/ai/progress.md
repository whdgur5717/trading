# Progress

Last updated: 2026-06-24

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

## In Progress

- `TASK-0002`: Backend error layer.
- `TASK-0003`: API request verification.

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
