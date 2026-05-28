import { queryOptions } from "@tanstack/react-query"

import {
  STOCKS_CONTROLLER_HISTORY,
  type StocksControllerHistoryParams,
} from "@/queries/generated"

export const getStockHistoryQueryOptions = (
  params: StocksControllerHistoryParams
) =>
  queryOptions({
    queryKey: ["stock", params.code, "history", params.date],
    queryFn: async () => {
      const response = await STOCKS_CONTROLLER_HISTORY(params)

      return response.data
    },
  })
