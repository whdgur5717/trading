# 백엔드 운영 모니터링

## 목적

클라이언트에서 오류가 발생했을 때 프론트 문제인지 백엔드 문제인지 판단할 근거가
부족했다. 서버가 실행 중인지, 자원이 부족한지, 요청이 백엔드까지 도달했는지,
백엔드가 어떤 오류를 반환했는지를 확인할 수 있어야 한다.

백엔드는 이미 AWS EC2에서 운영하고 있으므로 첫 모니터링 도구로 CloudWatch를
사용한다. EC2 지표, 로그, 대시보드, 알람을 AWS 안에서 연결할 수 있고 별도의
모니터링 서버를 운영할 필요가 없기 때문이다. 현재 규모에서는 CloudWatch
대시보드로 필요한 정보를 확인할 수 있어 Grafana는 추가하지 않는다.

## 구성

```text
EC2 상태·CPU ───────────────────────────┐
CloudWatch Agent의 RAM·디스크 ──────────┼─> CloudWatch 대시보드·알람 ─> SNS 이메일
Nest 로그 ─> Docker awslogs ─> 로그 그룹 ─┘
                                  └─> 5xx 지표
```

CloudWatch Agent는 60초마다 RAM과 루트 디스크 사용률을 `Trading/EC2`
네임스페이스로 전송한다. EC2 상태와 CPU는 AWS가 제공하는 기본 지표를 사용한다.
백엔드 컨테이너의 stdout과 stderr는 Docker `awslogs` 드라이버가 CloudWatch
Logs로 전송한다.

## 감시 항목과 알람 기준

| 대상        | 알람 기준                          | 확인하려는 문제                     |
| ----------- | ---------------------------------- | ----------------------------------- |
| EC2 상태    | `StatusCheckFailed >= 1`, 2분 연속 | 인스턴스 또는 AWS 호스트 장애       |
| CPU         | 평균 85% 이상, 15분 연속           | 연산 과부하 또는 비정상 작업        |
| RAM         | 평균 85% 이상, 10분 연속           | 메모리 부족과 OOM 위험              |
| 루트 디스크 | 평균 85% 이상, 10분 연속           | 로그·이미지 등으로 인한 디스크 고갈 |
| HTTP 5xx    | 5분 동안 1건 이상                  | 백엔드가 처리하지 못한 요청 발생    |

EC2 상태, CPU, RAM, 디스크 지표가 들어오지 않는 경우도 장애로 취급한다. 5xx
지표는 오류가 없으면 데이터가 없을 수 있으므로 누락을 장애로 취급하지 않는다.
모든 알람은 `trading-prod-alerts` SNS topic을 거쳐 확인된 이메일 구독으로
전달한다.

## 로그

- 로그 그룹: `/trading/prod/back`
- 로그 스트림: `application`
- 보관 기간: 30일

프로덕션에서는 Nest JSON logger를 사용한다. 모든 요청에 request ID를 부여하고
응답의 `x-request-id` 헤더와 로그에 함께 기록한다. 공통 필드는 다음과 같다.

- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`

정상 응답은 `log`, 4xx 오류는 `warn`, 5xx 오류는 `error`로 기록한다. 정의된
오류는 `errorType`과 공개 가능한 `errorData`를 남긴다. 예상하지 못한 오류는
exception 이름, 메시지, stack과 cause를 내부 로그에 남기고 클라이언트에는 원본
정보를 노출하지 않는다.

서비스 내부에서는 예상 실패를 `Result`로 유지한다. HTTP 경계에서 interceptor가
`Result.err`를 `HttpException`으로 넘기고 전역 `ApiExceptionFilter`가 오류 응답과
로그를 한 번만 처리한다. 자세한 오류 흐름은
[백엔드 오류 아키텍처](./backend-error-architecture.md)를 따른다.

`Http5xx` metric filter는 `ApiExceptionFilter`가 남긴 JSON 로그 중
`message.statusCode >= 500`인 항목을 `Trading/Back`의 `Http5xxCount` 지표로
변환한다.

## 오류를 확인하는 순서

1. 클라이언트 응답의 `x-request-id`와 오류 발생 시각을 확인한다.
2. CloudWatch Logs에서 request ID로 검색한다.
3. 로그가 있으면 요청이 백엔드까지 도달한 것이다. `statusCode`, `errorType`,
   exception과 stack을 확인한다.
4. 로그가 없으면 EC2 상태와 CPU·RAM·디스크 알람을 확인한다. 모두 정상이라면
   요청이 애플리케이션에 도달하기 전의 프론트·네트워크·Cloudflare 경로를
   확인한다.

CloudWatch Logs Insights에서는 다음처럼 request ID를 찾을 수 있다.

```text
fields @timestamp, context, message
| filter message.requestId = "<request-id>"
| sort @timestamp desc
```

## 관리 위치

- 저장소: CloudWatch Agent 설정, EC2 IAM 권한, Docker `awslogs` 설정
- AWS CloudWatch: `trading-back-prod` 대시보드, 로그 그룹, metric filter, 알람
- AWS SNS: `trading-prod-alerts` topic과 이메일 구독

현재 구성은 외부에서 `/health`를 주기적으로 호출하지 않는다. 따라서 Cloudflare를
포함한 공개 요청 경로의 가용성을 사전에 검사하는 기능은 이 모니터링 범위에
포함되지 않는다.
