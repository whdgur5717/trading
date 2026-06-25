import { queryOptions } from "@tanstack/react-query"

import {
  CANDLES_CONTROLLER_CANDLES,
  type CandlesControllerCandlesFailure,
  type CandlesControllerCandlesParams,
  type CandlesControllerCandlesSuccess,
} from "@/queries/generated"

type StockHistoryData = CandlesControllerCandlesSuccess["body"]["data"]

export const getStockHistoryQueryOptions = (
  params: CandlesControllerCandlesParams
) =>
  queryOptions<StockHistoryData, CandlesControllerCandlesFailure>({
    queryKey: [
      "stock",
      params.symbol,
      "history",
      params.interval,
      params.count,
      params.before,
    ],
    queryFn: () =>
      CANDLES_CONTROLLER_CANDLES(params).match(
        (response) => response.body.data,
        (response) => {
          throw response
        }
      ),
  })
