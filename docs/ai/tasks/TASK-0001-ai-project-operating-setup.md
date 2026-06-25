# TASK-0001: AI Project Operating Setup

Status: Done
Last updated: 2026-06-18

## Goal

Codex가 이 저장소에서 작업할 때 사용자가 매번 지시하지 않아도 프로젝트 맥락을
읽고, 작업 중 생긴 결정과 진행 상태를 저장소에 기록하게 합니다.

## Scope

- Repo-local Codex 설정 추가.
- AI 작업 기록 디렉터리 추가.
- 루트 `AGENTS.md`에 기록 루프 연결.
- 반복 워크플로우를 repo skill로 추가.
- 사람이 보는 진입점과 문서 형식 추가.
- 프로젝트 맥락, 기능 맥락, 디자인 맥락 저장 위치 추가.

## Verification

- `quick_validate.py`를 임시 venv에서 실행해 `Skill is valid!`를 확인했습니다.
- `.codex/config.toml`은 Python `tomllib`로 파싱 확인했습니다.
- 변경 파일 목록을 확인했습니다.
- skill 이름을 `project-operating-system`으로 바꾼 뒤 validator를 다시 통과했습니다.
- 이전 `trading-project-workflow` 참조가 남지 않았음을 확인했습니다.

## Notes

- Codex Memories는 보조 기억으로 켜되, 프로젝트의 공식 기록은 `docs/ai/`에
  남깁니다.
- Hook 기반 강제 검사는 초기 운영 후 필요할 때 추가합니다.
