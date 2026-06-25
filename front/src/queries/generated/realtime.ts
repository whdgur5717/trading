import { apiBaseUrl } from "../api"
import { type RealtimeControllerStreamResponse400 } from "./schemas"
export {
  RealtimeControllerStreamEventSchema,
  RealtimeControllerStreamResponse400Schema,
} from "./schemas"
export type {
  RealtimeControllerStreamEvent,
  RealtimeControllerStreamResponse400,
} from "./schemas"

export type RealtimeControllerStreamParams = {
  symbols: string
}

export type RealtimeControllerStreamFailure = {
  status: 400
  body: RealtimeControllerStreamResponse400
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
