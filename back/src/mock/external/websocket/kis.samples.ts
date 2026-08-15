const emptyRealtimeFields = Array.from({ length: 30 }, () => "")

const realtimeTradeValues = [
  "005930",
  "093000",
  "70000",
  ...emptyRealtimeFields,
  "20260517",
]
const realtimeTradeValues2 = [
  "005930",
  "093001",
  "69891",
  ...emptyRealtimeFields,
  "20260517",
]
const realtimeTradeValues3 = [
  "005930",
  "093002",
  "70465",
  ...emptyRealtimeFields,
  "20260517",
]
const realtimeTradeValues4 = [
  "005930",
  "093003",
  "69002",
  ...emptyRealtimeFields,
  "20260517",
]

export const realtimeAckOutput = {
  iv: "abcdefghijklml",
  key: "abcdefghijklnmopqrstuvwxyzabcdefghijkl",
}

export const realtimeTradeMessage = `0|H0STCNT0|001|${realtimeTradeValues.join(
  "^"
)}`

export const realtimeTradeMessages = [
  realtimeTradeMessage,
  `0|H0STCNT0|001|${realtimeTradeValues2.join("^")}`,
  `0|H0STCNT0|001|${realtimeTradeValues3.join("^")}`,
  `0|H0STCNT0|001|${realtimeTradeValues4.join("^")}`,
]
