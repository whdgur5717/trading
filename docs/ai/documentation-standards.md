# Documentation Standards

Last updated: 2026-06-18

## Status Labels

- `Proposed`: 제안됨. 아직 적용 전입니다.
- `In Progress`: 진행 중입니다.
- `Done`: 완료했고 필요한 검증을 남겼습니다.
- `Blocked`: 외부 입력이나 결정 없이는 진행할 수 없습니다.
- `Superseded`: 다른 문서나 결정으로 대체되었습니다.

## File Naming

- 작업: `docs/ai/tasks/TASK-0000-short-title.md`
- 결정: `docs/ai/decisions/YYYY-MM-DD-short-title.md`
- 기능: `docs/ai/features/short-feature-name.md`
- 디자인 노트: `docs/ai/design/YYYY-MM-DD-short-title.md`
- 조사: `docs/ai/research/YYYY-MM-DD-short-title.md`

파일명은 영어 소문자와 하이픈을 사용합니다. 본문은 한국어로 작성해도 됩니다.

## Task Format

```md
# TASK-0000: Title

Status: Proposed | In Progress | Done | Blocked
Last updated: YYYY-MM-DD

## Goal

## Scope

## Assumptions

## Changes

## Verification

## Next
```

## Feature Format

```md
# Feature: Name

Status: Proposed | In Progress | Done
Last updated: YYYY-MM-DD

## User Problem

## Goal

## Non-goals

## User Flow

## Acceptance Criteria

## Data And API

## UX And Accessibility

## Verification
```

## Design Note Format

```md
# Design: Title

Status: Proposed | Accepted | Superseded
Last updated: YYYY-MM-DD

## Surface

## Context

## Decision

## Design System Usage

## Accessibility

## Open Questions
```

## Decision Format

```md
# Decision: Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded

## Context

## Decision

## Consequences

## Verification
```

## Writing Rules

- 다음 사람이 작업을 이어받는 데 필요한 정보만 씁니다.
- 구현 상세보다 이유, 상태, 검증, 남은 판단을 우선합니다.
- 긴 로그, 원시 응답, 비밀값, 토큰, 계정 정보는 쓰지 않습니다.
- 안정적인 제품/디자인 원칙은 `PRODUCT.md`, `DESIGN.md`에 둡니다.
- 현재 작업 때문에 생긴 임시 맥락은 `active-context.md`에 두고, 완료되면 작업
  파일이나 결정 파일로 옮깁니다.
