# 이슈 트래커

이 저장소의 이슈와 PRD는 GitHub Issues에 둔다. 작업자는 저장소 안에서 `gh`
명령으로 조회하고 기록한다.

## 기본 작업

| 작업      | 명령                                                                  |
| --------- | --------------------------------------------------------------------- |
| 이슈 생성 | `gh issue create --title "..." --body "..."`                          |
| 이슈 조회 | `gh issue view <number> --comments`                                   |
| 이슈 목록 | `gh issue list --state open --json number,title,body,labels,comments` |
| 댓글 추가 | `gh issue comment <number> --body "..."`                              |
| 라벨 추가 | `gh issue edit <number> --add-label "..."`                            |
| 라벨 제거 | `gh issue edit <number> --remove-label "..."`                         |
| 이슈 닫기 | `gh issue close <number> --comment "..."`                             |

여러 줄 본문은 heredoc으로 넘긴다. 저장소 정보는 현재 clone의 `git remote`를
기준으로 잡는다.

## PR 처리

외부 PR은 이 저장소의 트리아지 입력으로 쓰지 않는다. 요청, PRD, 작업 단위는
GitHub Issue에 남긴다.

## 대형 조사 작업

큰 조사 작업은 map 이슈 하나와 하위 이슈들로 나눈다.

| 항목      | 규칙                                                                                         |
| --------- | -------------------------------------------------------------------------------------------- |
| map 이슈  | `wayfinder:map` 라벨을 붙인다.                                                               |
| 하위 이슈 | `Part of #<map>`을 본문 상단에 적고 `wayfinder:<type>` 라벨을 붙인다.                        |
| 차단 관계 | GitHub dependency를 우선 사용한다. 사용할 수 없으면 `Blocked by: #<n>`을 본문 상단에 적는다. |
| 점유      | 작업을 시작할 때 담당자를 자신으로 지정한다.                                                 |
| 완료      | 답변 댓글을 남기고 이슈를 닫는다.                                                            |
