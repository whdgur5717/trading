import { apiBaseUrl } from "../api"
export { RealtimeControllerStreamEventSchema } from "./schemas"
export type { RealtimeControllerStreamEvent } from "./schemas"

export type RealtimeControllerStreamParams = {
  symbols: string
}

/**
 * @example
 * ```ts
 * const eventSource = REALTIME_CONTROLLER_STREAM({
 *   symbols: "005930,000660"
 * })
 * ```
 */
export function REALTIME_CONTROLLER_STREAM(
  params: RealtimeControllerStreamParams
): EventSource {
  const searchParams = new URLSearchParams()
  searchParams.set("symbols", String(params.symbols))
  const queryString = searchParams.toString()

  return new EventSource(
    apiBaseUrl + "/realtime/stream" + (queryString ? `?${queryString}` : "")
  )
}
