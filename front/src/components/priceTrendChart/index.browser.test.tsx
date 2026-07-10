import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "vitest-browser-react"

import { PriceTrendChart, type PriceTrendData } from "."

const data = [
  { time: "2026-05-18", value: 70000 },
  { time: "2026-05-19", value: 72000 },
  { time: "2026-05-20", value: 69000 },
  { time: "2026-05-21", value: 76000 },
] satisfies PriceTrendData[]

describe("PriceTrendChart", () => {
  afterEach(async () => {
    await cleanup()
  })

  it("renders custom marker content at a price point", async () => {
    const screen = await render(
      <PriceTrendChart data={data}>
        <PriceTrendChart.Marker point={data.at(-1)}>
          <span aria-label="현재 가격 표시점">현재 가격 표시점</span>
        </PriceTrendChart.Marker>
      </PriceTrendChart>
    )

    await expect
      .element(screen.getByLabelText("현재 가격 표시점"))
      .toBeVisible()
  })
})
