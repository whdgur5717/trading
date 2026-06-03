import { api } from "../api"
import {
  StocksControllerSuggestionResponseSchema,
  type StocksControllerSuggestionResponse,
  StocksControllerSearchResponseSchema,
  type StocksControllerSearchResponse,
  StocksControllerCurrentResponseSchema,
  type StocksControllerCurrentResponse,
  StocksControllerHistoryResponseSchema,
  type StocksControllerHistoryResponse,
} from "./schemas"

export type StocksControllerSuggestionParams = {
  q: string
  limit?: number
}

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_SUGGESTION({
 *   q: "삼ㅈ",
 *   limit: 10
 * })
 * ```
 */
export async function STOCKS_CONTROLLER_SUGGESTION(
  params: StocksControllerSuggestionParams
): Promise<StocksControllerSuggestionResponse> {
  const data = await api
    .get<StocksControllerSuggestionResponse>("stocks/suggestion", {
      searchParams: {
        q: params.q,
        limit: params.limit,
      },
    })
    .json()

  return StocksControllerSuggestionResponseSchema.parse(data)
}

export type StocksControllerSearchParams = {
  q: string
}

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_SEARCH({
 *   q: "삼성"
 * })
 * ```
 */
export async function STOCKS_CONTROLLER_SEARCH(
  params: StocksControllerSearchParams
): Promise<StocksControllerSearchResponse> {
  const data = await api
    .get<StocksControllerSearchResponse>("stocks/search", {
      searchParams: {
        q: params.q,
      },
    })
    .json()

  return StocksControllerSearchResponseSchema.parse(data)
}

export type StocksControllerCurrentParams = {
  code: string
}

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_CURRENT({
 *   code: "005930"
 * })
 * ```
 */
export async function STOCKS_CONTROLLER_CURRENT(
  params: StocksControllerCurrentParams
): Promise<StocksControllerCurrentResponse> {
  const data = await api
    .get<StocksControllerCurrentResponse>(
      `stocks/${encodeURIComponent(String(params.code))}/current`
    )
    .json()

  return StocksControllerCurrentResponseSchema.parse(data)
}

export type StocksControllerHistoryParams = {
  code: string
  date: string
}

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_HISTORY({
 *   code: "005930",
 *   date: "2026-05-15"
 * })
 * ```
 */
export async function STOCKS_CONTROLLER_HISTORY(
  params: StocksControllerHistoryParams
): Promise<StocksControllerHistoryResponse> {
  const data = await api
    .get<StocksControllerHistoryResponse>(
      `stocks/${encodeURIComponent(String(params.code))}/history`,
      {
        searchParams: {
          date: params.date,
        },
      }
    )
    .json()

  return StocksControllerHistoryResponseSchema.parse(data)
}
