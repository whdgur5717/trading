import type { QuotationMarket } from "../../port/data"

export const quotationMarketCode = {
  KRX: "J",
  NXT: "NX",
  CONSOLIDATED: "UN",
} satisfies Record<QuotationMarket, string>
