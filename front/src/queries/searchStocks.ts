import { queryOptions } from "@tanstack/react-query"

import {
  STOCKS_CONTROLLER_SUGGESTION,
  type StocksControllerSuggestionParams,
} from "@/queries/generated"

export const searchStocksQueryOptions = (
  params: StocksControllerSuggestionParams
) =>
  queryOptions({
    queryKey: ["stocks", "suggestion", params.q, params.limit],
    queryFn: async () => {
      const response = await STOCKS_CONTROLLER_SUGGESTION(params)

      return response.data.items
    },
    staleTime: Infinity,
  })
