import { calculateReturnResult } from "./returns-calculation"
import { describe, expect, it } from "vitest"

describe("calculateReturnResult", () => {
  it("calculates amounts, profit, and profit rate", () => {
    expect(
      calculateReturnResult({
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

  it("returns zero profit rate when buy amount is zero", () => {
    expect(
      calculateReturnResult({
        buyPrice: 0,
        currentPrice: 271500,
        quantity: 10,
      })
    ).toMatchObject({
      buyAmount: 0,
      profitRate: 0,
    })
  })
})
