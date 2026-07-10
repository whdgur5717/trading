import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  ReturnsControllerCalculateResponse200Schema,
  type ReturnsControllerCalculateResponse200,
  ReturnsControllerCalculateResponse404Schema,
  type ReturnsControllerCalculateResponse404,
  ReturnsControllerCalculateResponse502Schema,
  type ReturnsControllerCalculateResponse502,
  ReturnsControllerCalculateResponse504Schema,
  type ReturnsControllerCalculateResponse504,
  ReturnsControllerChartResponse200Schema,
  type ReturnsControllerChartResponse200,
  ReturnsControllerChartResponse404Schema,
  type ReturnsControllerChartResponse404,
  ReturnsControllerChartResponse502Schema,
  type ReturnsControllerChartResponse502,
  ReturnsControllerChartResponse504Schema,
  type ReturnsControllerChartResponse504,
} from "./schemas"

export type ReturnsControllerCalculateParams = {
  symbol: string
  buyDate: string
  quantity: number
}

export type ReturnsControllerCalculateSuccess = {
  status: 200
  body: ReturnsControllerCalculateResponse200
}

export type ReturnsControllerCalculateFailure =
  | { status: 404; body: ReturnsControllerCalculateResponse404 }
  | { status: 502; body: ReturnsControllerCalculateResponse502 }
  | { status: 504; body: ReturnsControllerCalculateResponse504 }

/**
 * @example
 * ```ts
 * await RETURNS_CONTROLLER_CALCULATE({
 *   symbol: "005930",
 *   buyDate: "2026-05-17",
 *   quantity: 10
 * })
 * ```
 */
export function RETURNS_CONTROLLER_CALCULATE(
  params: ReturnsControllerCalculateParams
): ResultAsync<
  ReturnsControllerCalculateSuccess,
  ReturnsControllerCalculateFailure
> {
  return ResultAsync.fromSafePromise(
    (async (): Promise<
      Result<
        ReturnsControllerCalculateSuccess,
        ReturnsControllerCalculateFailure
      >
    > => {
      const response = await api.get("returns", {
        searchParams: {
          symbol: params.symbol,
          buyDate: params.buyDate,
          quantity: params.quantity,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result =
            ReturnsControllerCalculateResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerCalculateResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerCalculateSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
        case 404: {
          const result =
            ReturnsControllerCalculateResponse404Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerCalculateResponse404Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerCalculateFailure = {
            status: 404,
            body: result.data,
          }

          return err(value)
        }
        case 502: {
          const result =
            ReturnsControllerCalculateResponse502Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerCalculateResponse502Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerCalculateFailure = {
            status: 502,
            body: result.data,
          }

          return err(value)
        }
        case 504: {
          const result =
            ReturnsControllerCalculateResponse504Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerCalculateResponse504Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerCalculateFailure = {
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

export type ReturnsControllerChartParams = {
  symbol: string
  buyDate: string
  quantity: number
}

export type ReturnsControllerChartSuccess = {
  status: 200
  body: ReturnsControllerChartResponse200
}

export type ReturnsControllerChartFailure =
  | { status: 404; body: ReturnsControllerChartResponse404 }
  | { status: 502; body: ReturnsControllerChartResponse502 }
  | { status: 504; body: ReturnsControllerChartResponse504 }

/**
 * @example
 * ```ts
 * await RETURNS_CONTROLLER_CHART({
 *   symbol: "005930",
 *   buyDate: "2026-05-17",
 *   quantity: 10
 * })
 * ```
 */
export function RETURNS_CONTROLLER_CHART(
  params: ReturnsControllerChartParams
): ResultAsync<ReturnsControllerChartSuccess, ReturnsControllerChartFailure> {
  return ResultAsync.fromSafePromise(
    (async (): Promise<
      Result<ReturnsControllerChartSuccess, ReturnsControllerChartFailure>
    > => {
      const response = await api.get("returns/chart", {
        searchParams: {
          symbol: params.symbol,
          buyDate: params.buyDate,
          quantity: params.quantity,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result = ReturnsControllerChartResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerChartResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerChartSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
        case 404: {
          const result = ReturnsControllerChartResponse404Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerChartResponse404Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerChartFailure = {
            status: 404,
            body: result.data,
          }

          return err(value)
        }
        case 502: {
          const result = ReturnsControllerChartResponse502Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerChartResponse502Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerChartFailure = {
            status: 502,
            body: result.data,
          }

          return err(value)
        }
        case 504: {
          const result = ReturnsControllerChartResponse504Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerChartResponse504Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerChartFailure = {
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
