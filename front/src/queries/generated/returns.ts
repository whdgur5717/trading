import { api } from "../api"
import {
  ReturnsControllerCalculateResponseSchema,
  type ReturnsControllerCalculateResponse,
} from "./schemas"

export type ReturnsControllerCalculateParams = {
  code: string
  buyDate: string
  quantity: number
}

/**
 * @example
 * ```ts
 * await RETURNS_CONTROLLER_CALCULATE({
 *   code: "005930",
 *   buyDate: "2026-05-15",
 *   quantity: 10
 * })
 * ```
 */
export async function RETURNS_CONTROLLER_CALCULATE(
  params: ReturnsControllerCalculateParams
): Promise<ReturnsControllerCalculateResponse> {
  const data = await api
    .get<ReturnsControllerCalculateResponse>("returns", {
      searchParams: {
        code: params.code,
        buyDate: params.buyDate,
        quantity: params.quantity,
      },
    })
    .json()

  return ReturnsControllerCalculateResponseSchema.parse(data)
}
