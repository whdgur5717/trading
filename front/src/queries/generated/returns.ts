import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  ReturnsControllerCalculateResponse200Schema,
  type ReturnsControllerCalculateResponse200,
  ReturnsControllerCalculateResponse400Schema,
  type ReturnsControllerCalculateResponse400,
  ReturnsControllerCalculateResponse404Schema,
  type ReturnsControllerCalculateResponse404,
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
  | { status: 400; body: ReturnsControllerCalculateResponse400 }
  | { status: 404; body: ReturnsControllerCalculateResponse404 }

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
  return new ResultAsync(
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
        case 400: {
          const result =
            ReturnsControllerCalculateResponse400Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "ReturnsControllerCalculateResponse400Schema",
              body,
              zodError: result.error,
            })
          }

          const value: ReturnsControllerCalculateFailure = {
            status: 400,
            body: result.data,
          }

          return err(value)
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
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  )
}
