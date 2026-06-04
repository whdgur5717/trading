import { api } from "../api"
import {
  PricesControllerCurrentResponseSchema,
  type PricesControllerCurrentResponse,
  PricesControllerQuoteResponseSchema,
  type PricesControllerQuoteResponse,
  PricesControllerDailyCandleResponseSchema,
  type PricesControllerDailyCandleResponse,
} from "./schemas"

export type PricesControllerCurrentParams = {
  code: string
}

/**
 * @example
 * ```ts
 * await PRICES_CONTROLLER_CURRENT({
 *   code: "005930"
 * })
 * ```
 */
export async function PRICES_CONTROLLER_CURRENT(
  params: PricesControllerCurrentParams
): Promise<PricesControllerCurrentResponse> {
  const data = await api
    .get<PricesControllerCurrentResponse>(
      `prices/${encodeURIComponent(String(params.code))}/current`
    )
    .json()

  return PricesControllerCurrentResponseSchema.parse(data)
}

export type PricesControllerQuoteParams = {
  code: string
}

/**
 * @example
 * ```ts
 * await PRICES_CONTROLLER_QUOTE({
 *   code: "005930"
 * })
 * ```
 */
export async function PRICES_CONTROLLER_QUOTE(
  params: PricesControllerQuoteParams
): Promise<PricesControllerQuoteResponse> {
  const data = await api
    .get<PricesControllerQuoteResponse>(
      `prices/${encodeURIComponent(String(params.code))}/quote`
    )
    .json()

  return PricesControllerQuoteResponseSchema.parse(data)
}

export type PricesControllerDailyCandleParams = {
  code: string
  date: string
}

/**
 * @example
 * ```ts
 * await PRICES_CONTROLLER_DAILY_CANDLE({
 *   code: "005930",
 *   date: "2026-05-15"
 * })
 * ```
 */
export async function PRICES_CONTROLLER_DAILY_CANDLE(
  params: PricesControllerDailyCandleParams
): Promise<PricesControllerDailyCandleResponse> {
  const data = await api
    .get<PricesControllerDailyCandleResponse>(
      `prices/${encodeURIComponent(String(params.code))}/daily-candle`,
      {
        searchParams: {
          date: params.date,
        },
      }
    )
    .json()

  return PricesControllerDailyCandleResponseSchema.parse(data)
}
