import { queryOptions } from "@tanstack/react-query"

import {
  PRICES_CONTROLLER_DAILY_CANDLE,
  type PricesControllerDailyCandleParams,
} from "@/queries/generated"

export const getStockHistoryQueryOptions = (
  params: PricesControllerDailyCandleParams
) =>
  queryOptions({
    queryKey: ["stock", params.code, "history", params.date],
    queryFn: async () => {
      const response = await PRICES_CONTROLLER_DAILY_CANDLE(params)

      return response.data
    },
  })
