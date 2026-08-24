---
name: manage-change-context
description: Preserve and recover the decision trail for repository changes. Use when creating or taking a GitHub Issue, starting implementation from an issue, investigating why existing code exists, committing, opening or updating a PR, or deciding whether to create or update an ADR.
---

# Manage Change Context

Maintain one navigable chain:

```text
Issue → linked branch → PR → commit/code
                    ↘ ADR when the decision constrains later work
```

Enter at the stage matching the request and stop at the boundary the user authorized. Do not
create or mutate GitHub records merely because the skill was invoked.

## 1. Establish the issue

Read `docs/agents/issue-tracker.md` before creating or triaging an issue. If an issue already
exists, read its body and every comment:

```sh
gh issue view <number> --comments
```

When issue creation is authorized, record enough to answer:

- What is observed or required, and what evidence supports it?
- Why does the work need to exist?
- What externally observable result marks completion?
- What constraints and non-goals are already known?
- Which questions remain unanswered before implementation?

Do not prescribe a solution unless it is already a requirement. When discussion changes the
agreed problem or scope, update the issue body to the current agreement and keep the comments as
the chronological record.

For work requiring independent PRs, create one work-unit issue per PR under a map issue rather
than attaching several implementation PRs directly to the map issue.

**Complete when:** the work-unit issue states the current problem, evidence, outcome, boundaries,
and unresolved blockers without relying on chat history.

## 2. Create the linked branch

Create the branch through the issue's Development relationship, not as an unrelated Git branch:

```sh
gh issue develop <number> --base main --name <branch-name>
gh issue develop <number> --list
```

Use a separate worktree when the current worktree contains unrelated changes. A PR created from
the linked branch inherits the issue relationship. Do not duplicate it with `Refs`, `Related to`,
or `Closes` in the PR body.

**Complete when:** `gh issue develop --list <number>` shows the branch intended for the work.

## 3. Recover existing context before editing

Read the issue and comments, the target code and adjacent implementation, and every applicable
`AGENTS.md`. Search `docs/adr/` using the package, domain, file, module, and symbol names involved;
read only relevant ADRs.

For an existing line whose rationale matters, find its last-changing commit:

```sh
git blame -L <start>,<end> -- <file>
git show <sha> -- <file>
```

Then find the PR associated with that commit and read the PR plus its linked issue:

```sh
gh api repos/<owner>/<repo>/commits/<sha>/pulls
gh pr view <number> --comments
```

`git blame` returns the last-changing commit, not the rationale. If it lands on formatting, code
movement, or another mechanical edit, use line history such as `git log -L` to reach the earlier
semantic change. Keep this as a fallback, not the default lookup.

If code, an active ADR, and historical records disagree, identify the conflict before editing.
Treat the issue and PR as historical evidence; treat an active ADR as the current decision unless
the present work explicitly reopens it.

**Complete when:** the relevant current constraints and historical reasons are known, or the exact
missing/conflicting context has been surfaced to the user.

## 4. Implement and commit

Change only what the work-unit issue requires. Keep each commit to one explainable intent. Write
the subject as the behavior or guarantee being introduced, not the file operation:

```text
fix(back): 외부 요청의 시작 간격을 보장한다
```

Avoid subjects such as `update config`, `modify files`, or bare `refactor`. Do not mix unrelated
changes into the commit or PR. Commit only when the user authorized committing.

**Complete when:** every changed line belongs to the issue and the commit subject explains the
change's intent to a future reader.

## 5. Write the PR

Open the PR from the issue-linked branch. Write a title that remains meaningful when encountered
later through blame or commit history. Preserve that title and the PR number in the final commit
title when the chosen merge method supports it.

Do not copy the issue or narrate the diff. Use free-form prose, but make the PR explain:

- the cause and evidence discovered during implementation;
- the chosen solution and why it fits;
- constraints or rejected alternatives that affected the choice;
- intentionally unresolved concerns; and
- differences between the issue's initial expectation and the result.

Do not add ritual sections such as a changed-files list or fixed verification field. Include a
check or result only when it is evidence for the decision or necessary to understand risk.

**Complete when:** the issue's Development relationship shows the PR and its body preserves the
reasoning that cannot be recovered from the diff.

## 6. Decide whether to record an ADR

Before the PR is ready to merge, ask:

> Does this choice constrain future work outside this PR's changed lines?

If yes, create or update an ADR in the same PR. If it only explains this incident or this
implementation, keep it in the PR. Read `docs/agents/domain.md` before changing ADRs.

Make every ADR searchable and bounded:

```md
# 결정 제목

- 상태: 적용 중 | 대체됨
- 적용 범위: 관련 패키지, 도메인, 파일·모듈·심볼과 검색할 수 있는 용어

## 맥락

결정이 필요했던 문제와 제약

## 결정

이후 작업이 따라야 할 원칙

## 이유와 영향

근거, 선택하지 않은 대안, 감수한 비용과 이후 구현의 경계

## 관련 기록

결정의 출발 이슈와 PR, 대체하거나 대체된 ADR
```

Treat existing ADRs without a status field as active until another ADR explicitly supersedes them.
Do not rewrite an old ADR to disguise a changed decision. Mark it superseded, create the new ADR,
and link them in both directions.

**Complete when:** either the durable constraint is recorded and linked, or the PR clearly remains
the only record because the choice does not constrain work outside its diff.

## 7. Verify the trail

Before handoff, verify the available chain in both directions:

```text
Issue → linked PR → commit/code
code → blame commit → associated PR → linked issue
                         ↘ active ADR when applicable
```

Do not claim that missing history proves there was no rationale. State which link is absent and
what evidence remains.

**Complete when:** a future agent can start from either the issue or a changed line and recover the
problem, implementation reasoning, and any still-active architectural constraint.
