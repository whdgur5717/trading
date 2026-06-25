---
name: project-operating-system
description: Use for non-trivial project work when Codex needs to plan, implement, review, debug, design, research, or continue prior work while keeping project context, PM/design/technical decisions, task status, feature notes, and verification records up to date in docs/ai. Trigger whenever the user asks to proceed with project work, create or update product/UI/backend/frontend behavior, investigate architecture, make a multi-step change, or continue work without being explicitly told which context files to read.
---

# Project Operating System

## Overview

Keep AI-assisted work in this repository continuous and auditable. Use the
checked-in AI records as the project source of truth, with Codex Memories acting
only as a personal recall layer.

## Start

1. Read `AGENTS.md`.
2. Read `docs/ai/START_HERE.md` to route the task.
3. Read `docs/ai/active-context.md`, `docs/ai/progress.md`, and
   `docs/ai/tasks/_index.md`.
4. If the task touches product intent, copy, feature scope, or user value, read
   `PRODUCT.md`, `docs/ai/project-context.md`, and the relevant file under
   `docs/ai/features/` if one exists.
5. If the task touches UI, visual design, components, layout, interaction, or
   accessibility, read `DESIGN.md` and `docs/ai/design/README.md`.
6. If the task is package-specific, read the closest package `AGENTS.md` before
   editing files in that package.

State assumptions and a brief plan for multi-step work. Keep the plan tied to
verification checks.

## Record During Work

Create or update a task file under `docs/ai/tasks/` when the work is multi-step,
spans more than one turn, changes product behavior, changes architecture, or
creates decisions future sessions must inherit.

Create or update a feature note under `docs/ai/features/` when the work changes
user-visible behavior, product scope, acceptance criteria, or rollout state.

Create or update a design note under `docs/ai/design/` when the work changes a
screen, flow, component behavior, visual direction, accessibility expectation,
or design-system usage.

Record only durable information:

- assumptions that affected implementation
- decisions and rejected alternatives
- changed constraints or package boundaries
- verification commands and outcomes
- remaining risks, blockers, or next actions

Do not record secrets, credentials, tokens, personal data, raw logs, or noisy
implementation trivia.

## Decision Capture

Add a decision file in `docs/ai/decisions/` when a choice changes product
direction, architecture, package boundaries, API contracts, design system rules,
data-source policy, or long-term workflow.

Use `YYYY-MM-DD-short-title.md`. Include context, decision, consequences, and
verification. Keep the entry short.

## Finish Gate

Before final response:

1. Run the narrowest relevant verification command when feasible.
2. Update `docs/ai/active-context.md` with current focus and next actions.
3. Update `docs/ai/progress.md` with done, in-progress, blocked, and verification
   status.
4. Update the relevant task file and `docs/ai/tasks/_index.md` when a task file
   exists or should exist.
5. Add or update a decision file if the work created a durable decision.
6. If no AI record update is needed, mention why in the final response.

Keep updates concise. Move stale detail out of `active-context.md` and into the
task or decision file.

## Useful References

- Human entry point: `docs/ai/START_HERE.md`
- Product context: `PRODUCT.md`
- Current project context: `docs/ai/project-context.md`
- Design system: `DESIGN.md`
- Design operating notes: `docs/ai/design/README.md`
- Documentation format: `docs/ai/documentation-standards.md`
- AI records: `docs/ai/`
- Frontend package rules: `front/AGENTS.md`
- Backend package rules: `back/AGENTS.md`
