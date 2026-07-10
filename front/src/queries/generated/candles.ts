import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  CandlesControllerCandlesResponse200Schema,
  type CandlesControllerCandlesResponse200,
  CandlesControllerCandlesResponse404Schema,
  type CandlesControllerCandlesResponse404,
  CandlesControllerCandlesResponse502Schema,
  type CandlesControllerCandlesResponse502,
  CandlesControllerCandlesResponse504Schema,
  type CandlesControllerCandlesResponse504,
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
  | { status: 404; body: CandlesControllerCandlesResponse404 }
  | { status: 502; body: CandlesControllerCandlesResponse502 }
  | { status: 504; body: CandlesControllerCandlesResponse504 }

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
  return ResultAsync.fromSafePromise(
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
        case 502: {
          const result =
            CandlesControllerCandlesResponse502Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "CandlesControllerCandlesResponse502Schema",
              body,
              zodError: result.error,
            })
          }

          const value: CandlesControllerCandlesFailure = {
            status: 502,
            body: result.data,
          }

          return err(value)
        }
        case 504: {
          const result =
            CandlesControllerCandlesResponse504Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "CandlesControllerCandlesResponse504Schema",
              body,
              zodError: result.error,
            })
          }

          const value: CandlesControllerCandlesFailure = {
            status: 504,
            body: result.data,
          }

          return err(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  ).andThen((result) => result)
}
