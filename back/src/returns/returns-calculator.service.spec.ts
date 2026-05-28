import { ReturnsCalculatorService } from "./returns-calculator.service"
import { describe, expect, it } from "vitest"

describe("ReturnsCalculatorService", () => {
  it("calculates return amount and percentage from buy/current price and quantity", () => {
    const service = new ReturnsCalculatorService()

    expect(
      service.calculate({
        buyPrice: 78000,
        currentPrice: 271500,
        quantity: 10,
      })
    ).toEqual({
      buyAmount: 780000,
      currentValue: 2715000,
      profit: 1935000,
      profitRate: 248.08,
    })
  })
})
