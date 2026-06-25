# API Error Codes

Public API errors use one envelope and one project-owned code set.

```ts
type ApiErrorResponse = {
  success: false
  error: {
    status: number
    code:
      | "invalid-request"
      | "unsupported-stock"
      | "market-data-unavailable"
      | "market-data-auth-unavailable"
      | "market-data-timeout"
      | "market-data-invalid-response"
      | "market-data-not-found"
      | "internal-error"
    message: string
    details?: unknown
  }
}
```

`error.status` repeats the HTTP status intentionally, so clients can inspect one
error object without reading transport metadata first.

## Code Definitions

| Code                           | Status | Use when                                                                                            |
| ------------------------------ | -----: | --------------------------------------------------------------------------------------------------- |
| `invalid-request`              |    400 | Query, path, or body validation fails.                                                              |
| `unsupported-stock`            |    404 | The symbol format is valid, but this service does not support that stock.                           |
| `market-data-unavailable`      |    502 | The market-data provider returned HTTP/business failure or could not complete a non-auth request.   |
| `market-data-auth-unavailable` |    502 | Market-data token, approval key, credential, permission, or auth refresh failed.                    |
| `market-data-timeout`          |    504 | The upstream market-data request timed out.                                                         |
| `market-data-invalid-response` |    502 | The provider response was received but did not match the expected schema.                           |
| `market-data-not-found`        |    404 | A required market-data point is absent, and the API cannot produce the requested result without it. |
| `internal-error`               |    500 | An unexpected server-side failure reached the filter.                                               |

## Boundaries

The code has three error boundaries.

1. Request DTO/Zod validation rejects malformed client input.
2. KIS adaptor code normalizes provider failures into `ExternalServiceError`.
3. `ApiExceptionFilter` maps known internal errors into the public envelope.

Controllers and application services do not inspect KIS status codes, KIS
messages, KIS endpoints, or raw provider payloads. They either call typed
services/ports or throw `ApiError` for endpoint-owned conditions.

## KIS Classification

KIS HTTP calls must return non-2xx responses to the KIS response parser instead
of letting Axios throw them as transport failures. `HttpRequestProvider` sets
`validateStatus: () => true` for that reason.

The KIS boundary classifies failures into these internal reasons:

```ts
type ExternalServiceErrorReason =
  | "unavailable"
  | "authUnavailable"
  | "timeout"
  | "invalidResponse"
  | "notFound"
```

Mapping to public codes:

| Internal reason   | Public code                    |
| ----------------- | ------------------------------ |
| `unavailable`     | `market-data-unavailable`      |
| `authUnavailable` | `market-data-auth-unavailable` |
| `timeout`         | `market-data-timeout`          |
| `invalidResponse` | `market-data-invalid-response` |
| `notFound`        | `market-data-not-found`        |

Classification rules:

- Authorization scope failures become `authUnavailable`.
- Market-data HTTP 401/403 becomes `authUnavailable`.
- Provider business errors that clearly indicate token/auth/permission failure
  become `authUnavailable`.
- Axios timeout codes such as `ECONNABORTED` and `ETIMEDOUT` become `timeout`.
- Other non-2xx HTTP responses and KIS business failures become `unavailable`.
- Schema parse failures in authorization scope become `authUnavailable`.
- Schema parse failures in market-data scope become `invalidResponse`.

## Empty Data

Empty market-data is not always an error.

`GET /candles?symbol=005930&interval=1d&count=100&before=2026-05-17`
returns a successful empty list when no candles match:

```json
{
  "success": true,
  "data": {
    "symbol": "005930",
    "interval": "1d",
    "candles": [],
    "nextBefore": null
  }
}
```

`GET /returns?symbol=005930&buyDate=2024-01-04&quantity=10` requires the
buy-date candle. If that candle is absent, the service throws
`ApiError("marketDataNotFound")`.

## Details

Known errors may include `details`. For external market-data failures, details
are diagnostic and currently include stable fields such as:

```ts
{
  service: "kis"
  domain: "market-data"
  reason: ExternalServiceErrorReason
  upstreamEndpoint?: string
  upstreamStatus?: number
  upstreamCode?: string
}
```

Raw upstream response bodies, tokens, secrets, and stack traces must not be
included in public responses.
