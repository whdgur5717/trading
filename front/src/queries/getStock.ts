import { queryOptions } from "@tanstack/react-query"

import {
  RETURNS_CONTROLLER_CALCULATE,
  type ReturnsControllerCalculateParams,
} from "@/queries/generated"

export const getStockQueryOptions = (
  params: ReturnsControllerCalculateParams
) =>
  queryOptions({
    queryKey: ["stock", params.code, params.buyDate, params.quantity],
    queryFn: async () => {
      const response = await RETURNS_CONTROLLER_CALCULATE(params)

      return response.data
    },
  })
