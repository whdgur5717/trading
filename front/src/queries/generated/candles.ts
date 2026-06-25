import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  CandlesControllerCandlesResponse200Schema,
  type CandlesControllerCandlesResponse200,
  CandlesControllerCandlesResponse400Schema,
  type CandlesControllerCandlesResponse400,
  CandlesControllerCandlesResponse404Schema,
  type CandlesControllerCandlesResponse404,
} from "./schemas"

export type CandlesControllerCandlesParams = {
  symbol: string
  interval: "1d"
  count?: number
  before?: string
}

export type CandlesControllerCandlesSuccess = {
  status: 200
  body: CandlesControllerCandlesResponse200
}

export type CandlesControllerCandlesFailure =
  | { status: 400; body: CandlesControllerCandlesResponse400 }
  | { status: 404; body: CandlesControllerCandlesResponse404 }

/**
 * @example
 * ```ts
 * await CANDLES_CONTROLLER_CANDLES({
 *   symbol: "005930",
 *   interval: "1d",
 *   count: 100,
 *   before: "2026-05-17"
 * })
 * ```
 */
export function CANDLES_CONTROLLER_CANDLES(
  params: CandlesControllerCandlesParams
): ResultAsync<
  CandlesControllerCandlesSuccess,
  CandlesControllerCandlesFailure
> {
  return new ResultAsync(
    (async (): Promise<
      Result<CandlesControllerCandlesSuccess, CandlesControllerCandlesFailure>
    > => {
      const response = await api.get("candles", {
        searchParams: {
          symbol: params.symbol,
          interval: params.interval,
          count: params.count,
          before: params.before,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result =
            CandlesControllerCandlesResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "CandlesControllerCandlesResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: CandlesControllerCandlesSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
        case 400: {
          const result =
            CandlesControllerCandlesResponse400Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "CandlesControllerCandlesResponse400Schema",
              body,
              zodError: result.error,
            })
          }

          const value: CandlesControllerCandlesFailure = {
            status: 400,
            body: result.data,
          }

          return err(value)
        }
        case 404: {
          const result =
            CandlesControllerCandlesResponse404Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "CandlesControllerCandlesResponse404Schema",
              body,
              zodError: result.error,
            })
          }

          const value: CandlesControllerCandlesFailure = {
            status: 404,
            body: result.data,
          }

          return err(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  )
}
