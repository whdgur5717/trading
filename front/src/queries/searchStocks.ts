import { queryOptions } from "@tanstack/react-query"

import {
  STOCKS_CONTROLLER_SUGGESTION,
  type StocksControllerSuggestionFailure,
  type StocksControllerSuggestionParams,
  type StocksControllerSuggestionSuccess,
} from "@/queries/generated"

type StockSuggestionItems =
  StocksControllerSuggestionSuccess["body"]["data"]["items"]

export const searchStocksQueryOptions = (
  params: StocksControllerSuggestionParams
) =>
  queryOptions<StockSuggestionItems, StocksControllerSuggestionFailure>({
    queryKey: ["stocks", "suggestion", params.q, params.limit],
    queryFn: () =>
      STOCKS_CONTROLLER_SUGGESTION(params).match(
        (response) => response.body.data.items,
        (response) => {
          throw response
        }
      ),
    staleTime: Infinity,
  })
