import { queryOptions } from "@tanstack/react-query"

import {
  STOCKS_CONTROLLER_SEARCH,
  type StocksControllerSearchParams,
} from "@/queries/generated"

export const searchStocksQueryOptions = (
  params: StocksControllerSearchParams
) =>
  queryOptions({
    queryKey: ["stocks", "search", params.q],
    queryFn: async () => {
      const response = await STOCKS_CONTROLLER_SEARCH(params)

      return response.data
    },
  })
