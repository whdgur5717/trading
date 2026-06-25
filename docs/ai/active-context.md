# Active Context

Last updated: 2026-06-24

## Current Focus

- AI 기반 프로젝트 운영 체계 1차 구성이 완료되었습니다.
- Codex는 이 저장소에서 단순 질의나 아주 작은 수정이 아닌 작업을 할 때
  `project-operating-system` skill과 `docs/ai/` 기록 루프를 사용해야 합니다.
- 사람이 프로젝트 맥락을 확인할 때는 `docs/ai/START_HERE.md`에서 시작합니다.
- 2026-06-24에는 `a.txt` 요청에 따라 `back` 패키지의 KIS OpenAPI 호출부,
  MSW mock 경계, Port/Adapter 결합도 변화를 분석했습니다. 결과는
  `docs/ai/tasks/TASK-0004-backend-kis-integration-analysis.md`에 남겼습니다.

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
