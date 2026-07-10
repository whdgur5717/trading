import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  StocksControllerSuggestionResponse200Schema,
  type StocksControllerSuggestionResponse200,
  StocksControllerSearchResponse200Schema,
  type StocksControllerSearchResponse200,
  StocksControllerGetResponse200Schema,
  type StocksControllerGetResponse200,
  StocksControllerGetResponse404Schema,
  type StocksControllerGetResponse404,
} from "./schemas"

export type StocksControllerSuggestionParams = {
  q: string
  limit?: number
}

export type StocksControllerSuggestionSuccess = {
  status: 200
  body: StocksControllerSuggestionResponse200
}

export type StocksControllerSuggestionFailure = never

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_SUGGESTION({
 *   q: "삼ㅈ",
 *   limit: 10
 * })
 * ```
 */
export function STOCKS_CONTROLLER_SUGGESTION(
  params: StocksControllerSuggestionParams
): ResultAsync<
  StocksControllerSuggestionSuccess,
  StocksControllerSuggestionFailure
> {
  return ResultAsync.fromSafePromise(
    (async (): Promise<
      Result<
        StocksControllerSuggestionSuccess,
        StocksControllerSuggestionFailure
      >
    > => {
      const response = await api.get("stocks/suggestion", {
        searchParams: {
          q: params.q,
          limit: params.limit,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result =
            StocksControllerSuggestionResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "StocksControllerSuggestionResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: StocksControllerSuggestionSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  ).andThen((result) => result)
}

export type StocksControllerSearchParams = {
  query: string
}

export type StocksControllerSearchSuccess = {
  status: 200
  body: StocksControllerSearchResponse200
}

export type StocksControllerSearchFailure = never

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_SEARCH({
 *   query: "삼성"
 * })
 * ```
 */
export function STOCKS_CONTROLLER_SEARCH(
  params: StocksControllerSearchParams
): ResultAsync<StocksControllerSearchSuccess, StocksControllerSearchFailure> {
  return ResultAsync.fromSafePromise(
    (async (): Promise<
      Result<StocksControllerSearchSuccess, StocksControllerSearchFailure>
    > => {
      const response = await api.get("stocks", {
        searchParams: {
          query: params.query,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result = StocksControllerSearchResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "StocksControllerSearchResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: StocksControllerSearchSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  ).andThen((result) => result)
}

export type StocksControllerGetParams = {
  symbol: string
}

export type StocksControllerGetSuccess = {
  status: 200
  body: StocksControllerGetResponse200
}

export type StocksControllerGetFailure = {
  status: 404
  body: StocksControllerGetResponse404
}

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_GET({
 *   symbol: "005930"
 * })
 * ```
 */
export function STOCKS_CONTROLLER_GET(
  params: StocksControllerGetParams
): ResultAsync<StocksControllerGetSuccess, StocksControllerGetFailure> {
  return ResultAsync.fromSafePromise(
    (async (): Promise<
      Result<StocksControllerGetSuccess, StocksControllerGetFailure>
    > => {
      const response = await api.get(
        `stocks/${encodeURIComponent(String(params.symbol))}`,
        {}
      )
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result = StocksControllerGetResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "StocksControllerGetResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: StocksControllerGetSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
        case 404: {
          const result = StocksControllerGetResponse404Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "StocksControllerGetResponse404Schema",
              body,
              zodError: result.error,
            })
          }

          const value: StocksControllerGetFailure = {
            status: 404,
            body: result.data,
          }

          return err(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  ).andThen((result) => result)
}
