import { queryOptions } from "@tanstack/react-query"

import {
  RETURNS_CONTROLLER_CALCULATE,
  type ReturnsControllerCalculateFailure,
  type ReturnsControllerCalculateParams,
  type ReturnsControllerCalculateSuccess,
} from "@/queries/generated"

type StockReturnData = ReturnsControllerCalculateSuccess["body"]["data"]

export const getStockQueryOptions = (
  params: ReturnsControllerCalculateParams
) =>
  queryOptions<StockReturnData, ReturnsControllerCalculateFailure>({
    queryKey: ["stock", params.symbol, params.buyDate, params.quantity],
    queryFn: () =>
      RETURNS_CONTROLLER_CALCULATE(params).match(
        (response) => response.body.data,
        (response) => {
          throw response
        }
      ),
  })
