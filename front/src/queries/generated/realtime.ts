import { apiBaseUrl } from "../api"
import {
  type StreamRealtimePricesResponse400,
  type StreamRealtimePricesResponse404,
} from "./schemas"
export {
  StreamRealtimePricesEventSchema,
  StreamRealtimePricesResponse400Schema,
  StreamRealtimePricesResponse404Schema,
} from "./schemas"
export type {
  StreamRealtimePricesEvent,
  StreamRealtimePricesResponse400,
  StreamRealtimePricesResponse404,
} from "./schemas"

export type StreamRealtimePricesParams = {
  symbols: string
}

export type StreamRealtimePricesFailure =
  | { status: 400; body: StreamRealtimePricesResponse400 }
  | { status: 404; body: StreamRealtimePricesResponse404 }

/**
 * @example
 * ```ts
 * const eventSource = STREAM_REALTIME_PRICES({
 *   symbols: "005930,000660"
 * })
 * ```
 */
export function STREAM_REALTIME_PRICES(
  params: StreamRealtimePricesParams
): EventSource {
  const searchParams = new URLSearchParams()
  searchParams.set("symbols", String(params.symbols))
  const queryString = searchParams.toString()

  return new EventSource(
    apiBaseUrl + "/realtime/stream" + (queryString ? `?${queryString}` : "")
  )
}
