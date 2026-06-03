import { api } from "../api"
import {
  StocksControllerSuggestionResponseSchema,
  type StocksControllerSuggestionResponse,
  StocksControllerSearchResponseSchema,
  type StocksControllerSearchResponse,
  StocksControllerGetResponseSchema,
  type StocksControllerGetResponse,
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

export type StocksControllerGetParams = {
  code: string
}

/**
 * @example
 * ```ts
 * await STOCKS_CONTROLLER_GET({
 *   code: "005930"
 * })
 * ```
 */
export async function STOCKS_CONTROLLER_GET(
  params: StocksControllerGetParams
): Promise<StocksControllerGetResponse> {
  const data = await api
    .get<StocksControllerGetResponse>(
      `stocks/${encodeURIComponent(String(params.code))}`
    )
    .json()

  return StocksControllerGetResponseSchema.parse(data)
}
