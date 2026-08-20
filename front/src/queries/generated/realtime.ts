import { apiBaseUrl } from "../api"
export { StreamRealtimePricesEventSchema } from "./schemas"
export type { StreamRealtimePricesEvent } from "./schemas"

export type StreamRealtimePricesParams = {
  symbols: string
}

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
