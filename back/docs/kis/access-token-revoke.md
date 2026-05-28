# 접근토큰폐기(P)[인증-002]

- 섹션: OAuth인증
- API ID: `dd3cb447-5034-4711-8c88-62c913429c7b`
- 공식 문서: https://apiportal.koreainvestment.com/apiservice-apiservice?/oauth2/revokeP

## 기본정보

| 항목         | 값                                             |
| ------------ | ---------------------------------------------- |
| API 유형     | REST                                           |
| Method       | `POST`                                         |
| URL          | `/oauth2/revokeP`                              |
| 실전 Domain  | `https://openapi.koreainvestment.com:9443`     |
| 모의 Domain  | `https://openapivts.koreainvestment.com:29443` |
| Format       | JSON                                           |
| Content-Type | `application/json; charset=UTF-8`              |
| 실전 TR ID   |                                                |
| 모의 TR ID   |                                                |

## 개요

부여받은 접큰토큰을 더 이상 활용하지 않을 때 사용합니다.

## 요청

### Body

| Element     | 한글명        | Type   | Required | Length | Description                                                                                                                                                                                                                                                  |
| ----------- | ------------- | ------ | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `appkey`    | 고객 앱Key    | String | Y        | 36     | 한국투자증권 홈페이지에서 발급받은 appkey (절대 노출되지 않도록 주의해주세요.)                                                                                                                                                                               |
| `appsecret` | 고객 앱Secret | String | Y        | 180    | 한국투자증권 홈페이지에서 발급받은 appsecret (절대 노출되지 않도록 주의해주세요.)                                                                                                                                                                            |
| `token`     | 접근토큰      | String | Y        | 286    | OAuth 토큰이 필요한 API 경우 발급한 Access token<br>일반고객(Access token 유효기간 1일, OAuth 2.0의 Client Credentials Grant 절차를 준용)<br>법인(Access token 유효기간 3개월, Refresh token 유효기간 1년, OAuth 2.0의 Authorization Code Grant 절차를 준용) |

## 응답

### Body

| Element   | 한글명     | Type   | Required | Length | Description   |
| --------- | ---------- | ------ | -------- | ------ | ------------- |
| `code`    | 응답코드   | String | N        | 8      | HTTP 응답코드 |
| `message` | 응답메세지 | String | N        | 450    | 응답메세지    |

## 예시

### Request

```json
{
  "appkey": "PSw2UvBQCpoZFc7nZpIfIrOttmXXXXXXXXXX",
  "appsecret": "/g84gaZp7W3DJEZhamiTH8ZdJkUJ8603rjo3HcOm5PvIc1YC3YmyJOQoW1H0kNjo4IbHwGUdi3+9oEbH4RKKl8GnEu3n/khxm0OrwHkQur+wbA74fcFXxaUnEbftu0X72Eaw9dEBMuK3rODeeOanrsJ1kZ9oKWykIG04F0nmgdXXXXXXXXXX",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6IjZmNDgxMjBiLTlmMDItNGI5ZS05MGExLTRiNDk2MGM5ZWY2MyIsImlzcyI6InVub2d3IiwiZXhwIjoxNjQzMjg2MDUzLCJpYXQiOjE2NDMxOTk2NTMsImp0aSI6IlBTdzJVdkJRQ3dvWkZhOG5acElmSXJPdHRtZUtLUGZCclNKcyJ9.6Z-UvArobBfXbnpSFbFhd9WPVEM3ZQa5NEpqfmQ6rrZBISCi-P9CEamfVReIduTVYbafF02Pl6EPXXXXXXXXXX"
}
```

### Response

```json
{
  "code": 200,
  "message": "접근토큰 폐기에 성공하였습니다"
}
```
