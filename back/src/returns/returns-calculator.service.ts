import { Injectable } from "@nestjs/common"
import type { ReturnCalculation } from "./returns.schema"

export interface ReturnCalculationInput {
  buyPrice: number
  currentPrice: number
  quantity: number
}

export type ReturnCalculationResult = ReturnCalculation

@Injectable()
export class ReturnsCalculatorService {
  calculate(input: ReturnCalculationInput): ReturnCalculationResult {
    const buyAmount = input.buyPrice * input.quantity
    const currentValue = input.currentPrice * input.quantity
    const profit = currentValue - buyAmount
    const profitRate =
      buyAmount === 0 ? 0 : Number(((profit / buyAmount) * 100).toFixed(2))

    return {
      buyAmount,
      currentValue,
      profit,
      profitRate,
    }
  }
}
