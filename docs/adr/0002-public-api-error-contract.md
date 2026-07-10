# 공개 API 오류 계약

공개 HTTP API 오류는
`{ success: false, error: { type, status, message, data } }` 형태로 반환한다.
`type`은 프로젝트가 소유하는 점 구분 네임스페이스 문자열이다.

각 모듈은 본인 책임의 오류를 `defineErrors()`로 정의한다. 오류 정의에는
고정 `type`, HTTP `status`, 고정 `message`, 공개 `data` 스키마가 포함된다.
동적 맥락은 `message`에 넣지 않고 `data`에 넣는다.

예상 가능한 실패는 `neverthrow`의 `Result` 또는 `ResultAsync`로 흐른다. 하위
계층 오류가 같은 의미면 그대로 전달하고, 현재 책임 경계에서 새 의미가 생기면
해당 모듈의 오류를 새로 정의한다. 검증 실패는 `common.invalid_request`,
예상하지 못한 throw 또는 rejection은 `common.internal`로 변환한다.

클라이언트는 외부 제공자 메시지나 원본 응답이 아니라 프로젝트 오류 `type`과
`data`로 분기한다.
