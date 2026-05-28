import { api } from "../api"
import {
  HealthControllerCheckResponseSchema,
  type HealthControllerCheckResponse,
} from "./schemas"

/**
 * @example
 * ```ts
 * await HEALTH_CONTROLLER_CHECK()
 * ```
 */
export async function HEALTH_CONTROLLER_CHECK(): Promise<HealthControllerCheckResponse> {
  const data = await api.get<HealthControllerCheckResponse>("health").json()

  return HealthControllerCheckResponseSchema.parse(data)
}
