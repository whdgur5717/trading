# Backend API Quick Reference

Frontend integration notes for the current NestJS backend.

## Base URL

```text
http://localhost:4000
```

The actual port comes from `PORT` in `.env`. If `PORT` is not set, the backend validation defaults it to `4000`.

## Common Notes

- No auth header is required by the current backend.
- CORS is not enabled unless `CORS_ALLOWED_ORIGINS` is set.
- Stock codes must be 6 digits, for example `005930`.
- Date strings must use `YYYY-MM-DD`, for example `2026-05-07`.
- Endpoints that call KIS require valid backend env vars such as `APP_KEY` and `APP_SECRET`.
- Validation failures return `400 Bad Request`.
- Unknown stock codes return `404 Not Found`.
- KIS upstream failures return `502 Bad Gateway`.

## Stock Search

Search local stock master data by Korean name or stock code.

```http
GET /stocks/search?q={keyword}
```

### Query

| Name | Type   | Required | Rule                          |
| ---- | ------ | -------- | ----------------------------- |
| `q`  | string | yes      | trimmed, at least 1 character |

### Example

```bash
curl "http://localhost:4000/stocks/search?q=%EC%82%BC%EC%84%B1"
```

```ts
const res = await fetch(
  `${API_BASE_URL}/stocks/search?q=${encodeURIComponent("삼성")}`
)
const stocks = await res.json()
```

### Response

```json
[
  {
    "code": "005930",
    "name": "삼성전자",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  }
]
```

## Current Price

Get current KIS price data for one stock.

```http
GET /stocks/{code}/current
```

### Path

| Name   | Type   | Required | Rule     |
| ------ | ------ | -------- | -------- |
| `code` | string | yes      | 6 digits |

### Example

```bash
curl "http://localhost:4000/stocks/005930/current"
```

```ts
const res = await fetch(`${API_BASE_URL}/stocks/005930/current`)
const current = await res.json()
```

### Response

```json
{
  "stock": {
    "code": "005930",
    "name": "삼성전자",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  },
  "marketCode": "J",
  "price": {
    "currentPrice": 271500,
    "openPrice": 272000,
    "highPrice": 277000,
    "lowPrice": 260000,
    "accumulatedVolume": 41404687,
    "previousDayChange": 5500,
    "previousDayChangeRate": 2.07
  }
}
```

## Daily Price History

Get one daily candle for one stock and date.

```http
GET /stocks/{code}/history?date={YYYY-MM-DD}
```

### Path

| Name   | Type   | Required | Rule     |
| ------ | ------ | -------- | -------- |
| `code` | string | yes      | 6 digits |

### Query

| Name   | Type   | Required | Rule         |
| ------ | ------ | -------- | ------------ |
| `date` | string | yes      | `YYYY-MM-DD` |

### Example

```bash
curl "http://localhost:4000/stocks/005930/history?date=2026-05-07"
```

```ts
const res = await fetch(`${API_BASE_URL}/stocks/005930/history?date=2026-05-07`)
const history = await res.json()
```

### Trading Day Response

```json
{
  "stock": {
    "code": "005930",
    "name": "삼성전자",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  },
  "requestedDate": "2026-05-07",
  "marketCode": "J",
  "isTradingDay": true,
  "candle": {
    "date": "20260507",
    "openPrice": 272000,
    "highPrice": 277000,
    "lowPrice": 260000,
    "closePrice": 271500,
    "accumulatedVolume": 41404687
  }
}
```

### Non-Trading Day Response

```json
{
  "stock": {
    "code": "005930",
    "name": "삼성전자",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  },
  "requestedDate": "2026-05-03",
  "marketCode": "J",
  "isTradingDay": false,
  "candle": null
}
```

## Return Calculation

Calculate profit/loss from buy-date close price to current price.

```http
GET /returns?code={code}&buyDate={YYYY-MM-DD}&quantity={quantity}
```

### Query

| Name       | Type   | Required | Rule                                                |
| ---------- | ------ | -------- | --------------------------------------------------- |
| `code`     | string | yes      | 6 digits                                            |
| `buyDate`  | string | yes      | `YYYY-MM-DD`                                        |
| `quantity` | number | yes      | positive integer; query string is coerced to number |

### Example

```bash
curl "http://localhost:4000/returns?code=005930&buyDate=2026-05-07&quantity=10"
```

```ts
const params = new URLSearchParams({
  code: "005930",
  buyDate: "2026-05-07",
  quantity: "10",
})

const res = await fetch(`${API_BASE_URL}/returns?${params}`)
const returns = await res.json()
```

### Response

```json
{
  "stock": {
    "code": "005930",
    "name": "삼성전자",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  },
  "buy": {
    "date": "2026-05-07",
    "price": 78000,
    "priceType": "adjusted-close",
    "quantity": 10
  },
  "current": {
    "price": 271500,
    "source": "kis-rest-current-price",
    "marketCode": "J"
  },
  "result": {
    "buyAmount": 780000,
    "currentValue": 2715000,
    "profit": 1935000,
    "profitRate": 248.08
  }
}
```

If `buyDate` is not a trading day, this endpoint returns `400 Bad Request`.

```json
{
  "message": "2026-05-03 is not a trading day for 005930",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Realtime Price Stream

Open a Server-Sent Events stream for one or more stock codes.

```http
GET /realtime/stream?stockCodes={stockCode1},{stockCode2}
```

### Query

| Name         | Type   | Required | Rule                                                                                    |
| ------------ | ------ | -------- | --------------------------------------------------------------------------------------- |
| `stockCodes` | string | yes      | comma-separated stock codes; each stock code is checked against local stock master data |

### Browser Example

```ts
const source = new EventSource(
  `${API_BASE_URL}/realtime/stream?stockCodes=005930,000660`
)

source.addEventListener("subscribed", (event) => {
  console.log("subscribed", JSON.parse(event.data))
})

source.addEventListener("price", (event) => {
  console.log("price", JSON.parse(event.data))
})

source.addEventListener("heartbeat", (event) => {
  console.log("heartbeat", JSON.parse(event.data))
})

source.addEventListener("error", (event) => {
  console.error("stream error", event)
})

// Call when leaving the page.
source.close()
```

### curl Example

```bash
curl -N "http://localhost:4000/realtime/stream?stockCodes=005930,000660"
```

### Event: subscribed

Sent once for each stock code registered for this client.

```text
event: subscribed
data: {"stockCode":"005930"}
```

### Event: price

Sent when the realtime feed sends a trade message for a subscribed stock code.

```text
event: price
data: {"trId":"H0STCNT0","stockCode":"005930","tradeTime":"153001","price":271500,"businessDate":"20260507"}
```

### Event: heartbeat

Sent every 15 seconds while the stream is open.

```text
event: heartbeat
data: {"at":"2026-05-07T06:30:00.000Z"}
```

## Health

Used by proxy/deployment health checks.

```http
GET /health
```

```json
{
  "status": "ok"
}
```

## Error Handling Helper

Use this wrapper for quick frontend testing.

```ts
export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.message || `Request failed: ${res.status}`)
  }

  return body as T
}
```

## Suggested Frontend Smoke Test Order

1. `GET /stocks/search?q=삼성`
2. `GET /stocks/005930/current`
3. `GET /stocks/005930/history?date=2026-05-07`
4. `GET /returns?code=005930&buyDate=2026-05-07&quantity=10`
5. `GET /realtime/stream?stockCodes=005930`
6. `GET /health`
