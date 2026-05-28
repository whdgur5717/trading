import { apiBaseUrl } from "../api"
export { RealtimeControllerStreamEventSchema } from "./schemas"
export type { RealtimeControllerStreamEvent } from "./schemas"

export type RealtimeControllerStreamParams = {
  stockCodes: string
}

/**
 * @example
 * ```ts
 * const eventSource = REALTIME_CONTROLLER_STREAM({
 *   stockCodes: "005930,000660"
 * })
 * ```
 */
export function REALTIME_CONTROLLER_STREAM(
  params: RealtimeControllerStreamParams
): EventSource {
  const searchParams = new URLSearchParams()
  searchParams.set("stockCodes", String(params.stockCodes))
  const queryString = searchParams.toString()

  return new EventSource(
    apiBaseUrl + "/realtime/stream" + (queryString ? `?${queryString}` : "")
  )
}
