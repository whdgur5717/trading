# Backend API Spec

Base URL:

```text
http://localhost:4000
```

Common:

```text
Auth: none
Content-Type: application/json
```

Errors:

```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

```json
{
  "message": "Unknown stock code: 123456",
  "error": "Not Found",
  "statusCode": 404
}
```

```json
{
  "message": "KIS request failed",
  "error": "Bad Gateway",
  "statusCode": 502
}
```

## GET /stocks/search

Search stocks by name or code.

### Query Parameters

| Name | Type   | Required | Description                       |
| ---- | ------ | -------- | --------------------------------- |
| `q`  | string | yes      | Search keyword. Minimum length: 1 |

### Request

```http
GET /stocks/search?q=삼성
```

### Response 200

```json
[
  {
    "code": "005930",
    "name": "삼성전자",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  },
  {
    "code": "005935",
    "name": "삼성전자우",
    "marketName": "KOSPI",
    "kisMarketCode": "J"
  }
]
```

### Response Fields

| Field           | Type                  | Description        |
| --------------- | --------------------- | ------------------ |
| `code`          | string                | 6-digit stock code |
| `name`          | string                | Stock name         |
| `marketName`    | string                | Market name        |
| `kisMarketCode` | `"J" \| "NX" \| "UN"` | KIS market code    |

## GET /stocks/{code}/current

Get current price for one stock.

### Path Parameters

| Name   | Type   | Required | Description        |
| ------ | ------ | -------- | ------------------ |
| `code` | string | yes      | 6-digit stock code |

### Request

```http
GET /stocks/005930/current
```

### Response 200

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

### Response Fields

| Field                         | Type                  | Description                         |
| ----------------------------- | --------------------- | ----------------------------------- |
| `stock`                       | object                | Stock metadata                      |
| `stock.code`                  | string                | 6-digit stock code                  |
| `stock.name`                  | string                | Stock name                          |
| `stock.marketName`            | string                | Market name                         |
| `stock.kisMarketCode`         | `"J" \| "NX" \| "UN"` | KIS market code                     |
| `marketCode`                  | `"J" \| "NX" \| "UN"` | KIS market code used for request    |
| `price.currentPrice`          | number                | Current price                       |
| `price.openPrice`             | number                | Open price                          |
| `price.highPrice`             | number                | High price                          |
| `price.lowPrice`              | number                | Low price                           |
| `price.accumulatedVolume`     | number                | Accumulated volume                  |
| `price.previousDayChange`     | number                | Price change from previous day      |
| `price.previousDayChangeRate` | number                | Price change rate from previous day |

## GET /stocks/{code}/history

Get daily candle for one stock and date.

### Path Parameters

| Name   | Type   | Required | Description        |
| ------ | ------ | -------- | ------------------ |
| `code` | string | yes      | 6-digit stock code |

### Query Parameters

| Name   | Type   | Required | Description                 |
| ------ | ------ | -------- | --------------------------- |
| `date` | string | yes      | Date in `YYYY-MM-DD` format |

### Request

```http
GET /stocks/005930/history?date=2026-05-07
```

### Response 200: Trading Day

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

### Response 200: Non-Trading Day

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

### Response Fields

| Field                      | Type                  | Description                                |
| -------------------------- | --------------------- | ------------------------------------------ |
| `stock`                    | object                | Stock metadata                             |
| `requestedDate`            | string                | Requested date in `YYYY-MM-DD` format      |
| `marketCode`               | `"J" \| "NX" \| "UN"` | KIS market code used for request           |
| `isTradingDay`             | boolean               | Whether the requested date has candle data |
| `candle`                   | object \| null        | Daily candle. `null` on non-trading day    |
| `candle.date`              | string                | Trading date in `YYYYMMDD` format          |
| `candle.openPrice`         | number                | Open price                                 |
| `candle.highPrice`         | number                | High price                                 |
| `candle.lowPrice`          | number                | Low price                                  |
| `candle.closePrice`        | number                | Close price                                |
| `candle.accumulatedVolume` | number                | Accumulated volume                         |

## GET /returns

Calculate return from buy-date close price to current price.

### Query Parameters

| Name       | Type   | Required | Description                     |
| ---------- | ------ | -------- | ------------------------------- |
| `code`     | string | yes      | 6-digit stock code              |
| `buyDate`  | string | yes      | Buy date in `YYYY-MM-DD` format |
| `quantity` | number | yes      | Positive integer                |

### Request

```http
GET /returns?code=005930&buyDate=2026-05-07&quantity=10
```

### Response 200

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

### Response Fields

| Field                 | Type                       | Description                    |
| --------------------- | -------------------------- | ------------------------------ |
| `stock`               | object                     | Stock metadata                 |
| `buy.date`            | string                     | Buy date                       |
| `buy.price`           | number                     | Buy-date close price           |
| `buy.priceType`       | `"adjusted-close"`         | Buy price type                 |
| `buy.quantity`        | number                     | Quantity                       |
| `current.price`       | number                     | Current price                  |
| `current.source`      | `"kis-rest-current-price"` | Current price source           |
| `current.marketCode`  | `"J" \| "NX" \| "UN"`      | KIS market code                |
| `result.buyAmount`    | number                     | `buy.price * buy.quantity`     |
| `result.currentValue` | number                     | `current.price * buy.quantity` |
| `result.profit`       | number                     | `currentValue - buyAmount`     |
| `result.profitRate`   | number                     | Profit rate percentage         |

### Response 400: Non-Trading Buy Date

```json
{
  "message": "2026-05-03 is not a trading day for 005930",
  "error": "Bad Request",
  "statusCode": 400
}
```

## GET /realtime/stream

Open Server-Sent Events stream for realtime price events.

### Query Parameters

| Name    | Type   | Required | Description                 |
| ------- | ------ | -------- | --------------------------- |
| `codes` | string | yes      | Comma-separated stock codes |

### Request

```http
GET /realtime/stream?codes=005930
```

```http
GET /realtime/stream?codes=005930,000660
```

### Response

Content-Type:

```text
text/event-stream
```

### Event: subscribed

```text
event: subscribed
data: {"code":"005930"}
```

Fields:

| Field  | Type   | Description           |
| ------ | ------ | --------------------- |
| `code` | string | Subscribed stock code |

### Event: price

```text
event: price
data: {"trId":"H0STCNT0","code":"005930","tradeTime":"153001","price":271500,"businessDate":"20260507"}
```

Fields:

| Field          | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| `trId`         | string | KIS realtime transaction ID        |
| `code`         | string | Stock code                         |
| `tradeTime`    | string | Trade time in `HHMMSS` format      |
| `price`        | number | Realtime trade price               |
| `businessDate` | string | Business date in `YYYYMMDD` format |

### Event: heartbeat

```text
event: heartbeat
data: {"at":"2026-05-14T07:30:00.000Z"}
```

Fields:

| Field | Type   | Description                    |
| ----- | ------ | ------------------------------ |
| `at`  | string | Server timestamp in ISO format |

### Event: error

```text
event: error
data: {"code":"005930","message":"KIS WebSocket is not open"}
```

Fields:

| Field     | Type   | Description   |
| --------- | ------ | ------------- |
| `code`    | string | Stock code    |
| `message` | string | Error message |
