import type { ReturnCalculation } from "./returns.schema"

export function calculateReturnResult(input: {
  buyPrice: number
  currentPrice: number
  quantity: number
}): ReturnCalculation {
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
