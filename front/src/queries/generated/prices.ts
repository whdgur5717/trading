import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  PricesControllerPriceResponse200Schema,
  type PricesControllerPriceResponse200,
  PricesControllerPriceResponse400Schema,
  type PricesControllerPriceResponse400,
  PricesControllerPriceResponse404Schema,
  type PricesControllerPriceResponse404,
} from "./schemas"

export type PricesControllerPriceParams = {
  symbol: string
}

export type PricesControllerPriceSuccess = {
  status: 200
  body: PricesControllerPriceResponse200
}

export type PricesControllerPriceFailure =
  | { status: 400; body: PricesControllerPriceResponse400 }
  | { status: 404; body: PricesControllerPriceResponse404 }

/**
 * @example
 * ```ts
 * await PRICES_CONTROLLER_PRICE({
 *   symbol: "005930"
 * })
 * ```
 */
export function PRICES_CONTROLLER_PRICE(
  params: PricesControllerPriceParams
): ResultAsync<PricesControllerPriceSuccess, PricesControllerPriceFailure> {
  return new ResultAsync(
    (async (): Promise<
      Result<PricesControllerPriceSuccess, PricesControllerPriceFailure>
    > => {
      const response = await api.get("prices", {
        searchParams: {
          symbol: params.symbol,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result = PricesControllerPriceResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "PricesControllerPriceResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: PricesControllerPriceSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
        case 400: {
          const result = PricesControllerPriceResponse400Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "PricesControllerPriceResponse400Schema",
              body,
              zodError: result.error,
            })
          }

          const value: PricesControllerPriceFailure = {
            status: 400,
            body: result.data,
          }

          return err(value)
        }
        case 404: {
          const result = PricesControllerPriceResponse404Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "PricesControllerPriceResponse404Schema",
              body,
              zodError: result.error,
            })
          }

          const value: PricesControllerPriceFailure = {
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
