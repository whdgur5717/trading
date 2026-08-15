# 외부 REST 계약의 단일 작성 경계

외부 제공자의 경로, 요청 header, 응답 스키마를 어댑터에서 수동으로 선언하고 같은
응답을 MSW handler와 JSON fixture에 다시 작성하면 하나의 변경이 여러 정의로
퍼진다. 실제 호출은 수정됐지만 mock은 이전 경로를 처리하거나, 어댑터의 수동
스키마와 fixture만 서로 맞아서 외부 계약의 변경을 놓칠 수 있다. 제공자를 추가할
때도 어떤 파일이 계약의 기준인지 코드 전체를 찾아야 했다.

각 제공자의 REST 계약은 `openapi/{provider}/rest/openapi.json`에 한 번 작성한다.
이 문서에는 제공자가 공개한 경로, parameter와 응답 구조만 둔다. 고정된 성공 응답,
업무 오류 시나리오와 HTTP 오류에 사용할 본문은 같은 위치의 `overlay.yaml`에 둔다.
mock을 위해 만든 값을 외부 제공자의 계약이나 응답 예시인 것처럼 기록하지 않는다.

생성 작업은 두 입력을 검증한 뒤 세 결과를 만든다. `api.ts`의 응답 스키마와
operation의 method, path, 고정 header는 실제 provider adaptor가 사용한다.
`api.msw.ts`의 기본 handler와 `api.scenarios.ts`의 named/default 응답은 개발 mock이
사용한다. 생성 결과는 입력이 아니므로 직접 수정하지 않는다. 외부 응답을 내부
모델로 변환하는 mapper, provider 오류의 의미, 인증과 재시도 같은 실행 정책은
생성하지 않는다.

mock 응답은 재현 가능한 고정값을 사용한다. 선택값이 없는 요청은 생성된 기본 성공
handler가 처리한다. `x-mock-scenario`는 overlay에 이름이 있는 업무 응답을 선택하고,
`x-mock-status`의 400부터 599까지의 값은 요청한 HTTP 상태와 operation의 default
오류 본문을 사용한다. 두 header가 함께 있거나 값이 유효하지 않으면 scenario
처리기가 응답을 만들지 않고 해당 operation의 기본 handler로 넘긴다. operation마다
조건문을 추가하지 않고 생성된 scenario 목록을 공통 처리기가 해석한다.

HTTP 200 본문이 성공과 업무 실패의 union인 제공자는 OpenAPI만으로 어느 분기가
성공인지 알 수 없다. 이 경우 `x-success-schema`가 성공 component를 가리키며,
생성기는 그 component가 같은 응답 union에 정확히 한 번 포함됐는지 확인한다. 요청에
항상 필요한 고정 header는 parameter의 `const`로 작성하고 생성된 operation 계약을
통해 전송한다. 제공자별 protocol 객체에 같은 값을 다시 선언하지 않는다.

계약이나 overlay가 불완전하면 기존 생성물을 계속 사용하는 대신 생성 단계에서
실패한다. provider 디렉터리의 `rest/openapi.json`은 생성 단계에서 자동으로
발견되지만, 생성된 mock을 실행 환경에 포함하려면
`src/mock/external/rest/handlers.ts`의 명시적인 조합에 추가해야 한다. 이 결정은
REST에만 적용하며 KIS WebSocket처럼 OpenAPI로 표현하지 않은 계약과 동작은 별도로
유지한다.

이 구조는 수동 handler와 JSON fixture보다 생성 도구에 의존하는 비용을 선택한다.
대신 실제 호출, 응답 검증과 개발 mock이 같은 계약 변경을 따라가며, mock 데이터만
바꾸는 작업은 provider 계약을 수정하지 않고 overlay에서 끝난다.
