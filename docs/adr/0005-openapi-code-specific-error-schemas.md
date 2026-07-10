# OpenAPI 타입별 오류 스키마

OpenAPI 오류 응답은 정의된 오류 `type`별 스키마를 사용한다. 하나의 HTTP
status에서 여러 프로젝트 오류 타입이 나올 수 있으면 `oneOf`를 쓰고, `success`,
`error.type`, `error.status`, `error.message` 값을 고정한다. `error.data`는
해당 오류 정의의 Zod 스키마에서 만든다.

OpenAPI 생성기는 컨트롤러 반환 타입의 `neverthrow` 오류 유니온에서 오류
`type`을 추출하고, `defineErrors()` registry에서 상태 코드와 `data` 스키마를
찾는다. 반환 타입에 존재하지만 registry에 없는 오류 타입은 생성 실패로 처리한다.
이렇게 해야 생성 클라이언트가 status 수준 실패가 아니라 실제 오류 타입 유니온을
받는다.
