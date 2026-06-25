import type { QuotationMarket } from "../../port/data"

export const rest = {
  accessToken: "/oauth2/tokenP",
  approvalKey: "/oauth2/Approval",
  price: {
    path: "/uapi/domestic-stock/v1/quotations/inquire-price",
    headers: {
      tr_id: "FHKST01010100",
    },
  },
  candles: {
    path: "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
    headers: {
      tr_id: "FHKST03010100",
    },
  },
  marketDay: {
    path: "/uapi/domestic-stock/v1/quotations/chk-holiday",
    headers: {
      tr_id: "CTCA0903R",
    },
  },
} as const

export const quotationMarketCode = {
  KRX: "J",
  NXT: "NX",
  CONSOLIDATED: "UN",
} satisfies Record<QuotationMarket, string>
