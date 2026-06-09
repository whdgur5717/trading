const realtimeTradeValues = [
  "005930",
  "093000",
  "70000",
  ...new Array<string>(30).fill(""),
  "20260517",
]

const realtimeTradeValues2 = [
  "005930",
  "093001",
  "69891",
  ...new Array<string>(30).fill(""),
  "20260517",
]

const realtimeTradeValues3 = [
  "005930",
  "093002",
  "70465",
  ...new Array<string>(30).fill(""),
  "20260517",
]

const realtimeTradeValues4 = [
  "005930",
  "093003",
  "69002",
  ...new Array<string>(30).fill(""),
  "20260517",
]

export const realtimeAckOutput = {
  iv: "abcdefghijklml",
  key: "abcdefghijklnmopqrstuvwxyzabcdefghijkl",
}

export const approvalKeyResponse = {
  approval_key: "testApprovalKey",
}

export const tokenResponse = {
  access_token: "testAccessToken",
  access_token_token_expired: "2099-12-31 23:59:59",
  token_type: "Bearer",
  expires_in: 86400,
}

export const currentPriceResponse = {
  rt_cd: "0",
  msg_cd: "MCA00000",
  msg1: "ok",
  output: {
    stck_prpr: "80000",
    stck_oprc: "79000",
    stck_hgpr: "81000",
    stck_lwpr: "78000",
    acml_vol: "12345678",
    prdy_vrss: "10000",
    prdy_ctrt: "14.29",
  },
}

export const dailyPriceResponse = {
  rt_cd: "0",
  msg_cd: "MCA00000",
  msg1: "ok",
  output2: [
    {
      stck_bsop_date: "20260517",
      stck_oprc: "69000",
      stck_hgpr: "71000",
      stck_lwpr: "68000",
      stck_clpr: "70000",
      acml_vol: "12345678",
    },
    {
      stck_bsop_date: "20260608",
      stck_oprc: "79000",
      stck_hgpr: "81000",
      stck_lwpr: "78000",
      stck_clpr: "80000",
      acml_vol: "22345678",
    },
  ],
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
