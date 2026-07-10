import { z } from "zod"
import { defineErrors, type ErrorOf } from "../common/error/define"

export const stockErrors = defineErrors({
  unsupported: {
    type: "stock.unsupported",
    status: 404,
    message: "Unsupported stock symbol",
    description: "The requested stock symbol is not supported by this service.",
    data: z.object({
      symbol: z.string().meta({ example: "005930" }),
    }),
  },
})

export type StockError = ErrorOf<typeof stockErrors>
