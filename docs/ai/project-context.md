# Project Context

Last updated: 2026-06-18

## Purpose

이 파일은 현재 프로젝트 운영 맥락을 모으는 지도입니다. 제품의 안정적인 원칙은
`PRODUCT.md`에 두고, 이 파일에는 현재 진행 상태, 문서 위치, 운영상 합의만
남깁니다.

## Source Of Truth

| Topic                      | Source                               |
| -------------------------- | ------------------------------------ |
| 제품 목적, 사용자, 톤      | `PRODUCT.md`                         |
| 디자인 시스템, 스타일 원칙 | `DESIGN.md`                          |
| 현재 작업 맥락             | `docs/ai/active-context.md`          |
| 진행 상태                  | `docs/ai/progress.md`                |
| 작업 목록                  | `docs/ai/tasks/_index.md`            |
| 기능별 스펙                | `docs/ai/features/`                  |
| 디자인 결정과 화면 노트    | `docs/ai/design/`                    |
| 장기 결정                  | `docs/ai/decisions/`                 |
| 조사 결과                  | `docs/ai/research/`                  |
| 문서 작성 규칙             | `docs/ai/documentation-standards.md` |

## Current Operating Model

- `front`와 `back`은 독립 패키지입니다.
- 교차 패키지 변경은 이유와 검증 범위를 먼저 남깁니다.
- 기능 변경은 가능하면 기능 노트에 목적, 사용자 영향, 수용 기준을 남깁니다.
- UI 변경은 디자인 노트에 적용 화면, 사용한 디자인 원칙, 접근성 고려를 남깁니다.
- 장기적으로 반복될 규칙은 `AGENTS.md`나 패키지별 `AGENTS.md`에 승격합니다.

## Open Questions

- 현재 없음.
