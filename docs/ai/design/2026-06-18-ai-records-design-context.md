# Design: AI Records Design Context

Status: Accepted
Last updated: 2026-06-18

## Surface

AI 작업 기록 문서 구조.

## Context

프로젝트에는 이미 `DESIGN.md`가 있지만, 실제 화면이나 컴포넌트 작업 중 생기는
구체적인 디자인 판단을 저장할 위치가 필요합니다.

## Decision

- 안정적인 디자인 시스템 원칙은 `DESIGN.md`에 유지합니다.
- 작업 중 생기는 화면/컴포넌트 단위 판단은 `docs/ai/design/`에 저장합니다.
- 기능 요구사항과 연결되는 디자인 내용은 `docs/ai/features/`에도 연결합니다.
- 장기 디자인 시스템 변경은 `docs/ai/decisions/`에 결정으로 남깁니다.

## Design System Usage

이 구조는 `DESIGN.md`를 대체하지 않습니다. `DESIGN.md`를 원본으로 두고, 실제
작업에서 생긴 적용 판단만 보관합니다.

## Accessibility

UI 작업 기록에는 접근성 고려가 있으면 반드시 남깁니다. 단순히 ARIA를 추가했다는
식의 구현 로그가 아니라, 사용자가 어떤 상호작용을 할 수 있어야 하는지 기록합니다.

## Open Questions

- 없음.
