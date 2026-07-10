import { z } from "zod"
import { defineErrors } from "../common/error/define"

export const returnsErrors = defineErrors({
  buyPriceNotFound: {
    type: "returns.buy_price_not_found",
    status: 404,
    message: "Buy price was not found",
    description:
      "The requested buy date does not have the market data required to calculate returns.",
    data: z.object({
      symbol: z.string().meta({ example: "005930" }),
      buyDate: z.string().meta({ example: "2026-05-17" }),
    }),
  },
})
